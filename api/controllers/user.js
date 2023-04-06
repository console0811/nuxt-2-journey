import UserModel from "../../models/model.user"
import Database from "../services/service.database"
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import sendMail from "../services/service.mailer";
import { createFile, deleteFile } from "../services/service.spaces";

export function userCollection() {
    return Database.instance().collection('users')
}

export function createUser({ user = new UserModel(), profile = {} }) {
    const session = Database.client().startSession();
    const transactionOptions = {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
    };

    return session.withTransaction(async () => {
        delete user._id;
        const password = user.password || String(new ObjectId())

        const exist = await userCollection().countDocuments({ email: user.email })

        if (exist) return Promise.reject('Invalid, someone is already using that email.')

        user.password = await bcrypt.hash(password, 10)
            .catch(err => {
                console.log(err);
                return Promise.reject(err)
            })

        const insertResult = await userCollection()
            .insertOne(user, { session })
            .catch(() => Promise.reject('Failed to create user.'))

        await sendMail({
            to: user.email,
            subject: 'Account Credential',
            text: `Congratulation! here's your temporary password: ${password}.`,
            html: `<h1>Congratulation!</h1><br/>Here's your temporary password: ${password}.`
        })
            .catch(err => Promise.reject(err));

        if (profile.originalname) user.profile = profile.originalname

        if (profile.originalname) {
            await createFile({ data: profile.buffer, name: profile.originalname, type: profile.mimetype, directory: `${user.type}s/attachments/${insertResult.insertedId}/profile` })
                .catch(() => Promise.reject(`Failed to upload profile.`))

            await userCollection()
                .updateOne({ _id: insertResult.insertedId }, { $set: { profile: profile.originalname } }, { session })
                .catch(() => Promise.reject('Failed to push profile.'))
        }
    }, transactionOptions)
        .then(() => {
            session.endSession();
            return 'Congratulation! Please check your email, we sent you a verification containing your temporary password.'
        })
        .catch(err => {
            session.endSession();
            return Promise.reject(err)
        })


}


export function updateUser({ user = new UserModel(), attachments = [], profile = {} }) {
    const session = Database.client().startSession();
    const transactionOptions = {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
    };

    return session.withTransaction(async () => {

        let _id = user._id;
        delete user._id;

        try {
            _id = new ObjectId(_id)
        } catch (error) {
            return Promise.reject('Invalid ID.')
        }

        const exist = await userCollection().countDocuments({ _id: { $ne: _id }, email: user.email })

        if (exist) return Promise.reject('Invalid, someone is already using that email.')

        if (user.password) {
            user.password = await bcrypt.hash(user.password, 10)
                .catch(err => {
                    console.log(err);
                    return Promise.reject(err)
                })
        }

        await userCollection()
            .updateOne({ _id }, { $set: user }, { session })
            .catch(() => Promise.reject('Failed to update user.'))

        for (let index = 0; index < attachments.length; index++) {
            const { buffer, originalname, mimetype } = attachments[index];

            await createFile({ data: buffer, name: originalname, type: mimetype, directory: `${user.type}s/attachments/${_id}` })
                .then(() => console.log(`Successfully uploaded file, ${originalname}.`))
                .catch(() => Promise.reject(`Failed to upload attachment ${originalname}.`))

            await userCollection()
                .updateOne({ _id }, { $push: { attachments: originalname } }, { session })
                .catch(() => Promise.reject('Failed to push attachments.'))
        }

        const original = await userCollection().findOne({ _id }) || new UserModel();
        const missing = original.attachments.filter(
            (i) => !user.attachments.includes(i)
        )

        for (let index = 0; index < missing.length; index++) {
            const name = missing[index];

            await deleteFile(`${user.type}s/attachments/${_id}/${name}`)
                .then(() => console.log(`Successfully deleted attachment, ${name}.`))
                .catch(() => Promise.reject(`Failed to deleted attachment ${name}.`))

            await userCollection()
                .updateOne({ _id }, { $pull: { attachments: name } }, { session })
                .catch(() => Promise.reject('Failed to pull attachments.'))
        }

        if (profile.originalname) {
            await deleteFile(`${user.type}s/attachments/${_id}/profile/${user.profile}`)
                .then(() => console.log(`Successfully deleted profile, ${user.profile}.`))
                .catch(() => Promise.reject(`Failed to deleted profile ${user.profile}.`))

            await createFile({ data: profile.buffer, name: profile.originalname, type: profile.mimetype, directory: `${user.type}s/attachments/${_id}/profile` })
                .catch(() => Promise.reject(`Failed to upload profile.`))

            await userCollection()
                .updateOne({ _id }, { $set: { profile: profile.originalname } }, { session })
                .catch(() => Promise.reject('Failed to push profile.'))
        }

    }, transactionOptions)
        .then(() => {
            session.endSession();
            return 'Successfully updated user.'
        })
        .catch(err => {
            session.endSession();
            return Promise.reject(err)
        })
}

export function getUser(payload = {}) {
    return userCollection()
        .findOne(payload)
        .then(data => {
            delete data.password
            return { data: data || {} }
        })
        .catch(err => ({ err }))
}