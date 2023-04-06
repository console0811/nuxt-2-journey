import { ObjectId } from "mongodb";
import UserModel from "../../models/model.user";
import ApplicationModel from "../../models/model.application"
import Database from "../services/service.database"
import sendMail from "../services/service.mailer";
import ScholarshipModel from "../../models/model.scholarship";
import { createFile } from "../services/service.spaces";

export function applicantCollection() {
    return Database.instance().collection('applicants')
}

export async function getApplicantByScholarshipStatus({ id = '', status = '', limit = 10, skip = 0, search = "" } = {}) {
    try {
        id = new ObjectId(id)
    } catch (error) {
        return Promise.reject('Invalid ID')
    }

    const query = [
        {
            $sort: { _id: 1 }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'applicant',
                foreignField: '_id',
                as: 'applicantName'
            }
        },
        { $unwind: { path: "$applicantName", preserveNullAndEmptyArrays: true } },
        {
            $set: {
                applicantName: '$applicantName.name'
            }
        },
        {
            $match: { scholarship: id, status, applicantName: new RegExp(search, 'i') }
        }
    ];

    const count = await applicantCollection().aggregate([
        ...query,
        {
            $count: 'count'
        }
    ]).toArray().catch(err => console.log(err))

    return applicantCollection().aggregate([
        ...query,
        {
            $skip: skip * limit
        },
        {
            $limit: limit
        }
    ]).toArray()
        .then((items) => {
            return {
                items,
                length: count[0] ? count[0].count : 0
            }
        })
        .catch((err) => {
            console.log(err);
            return {
                items: [],
                length: 0
            }
        })
}

export function getApplicationByApplicant({ scholarship = '', applicant = '' } = {}) {
    try {
        scholarship = new ObjectId(scholarship)
    } catch (error) {
        return Promise.reject('Invalid ID.')
    }

    try {
        applicant = new ObjectId(applicant)
    } catch (error) {
        return Promise.reject('Invalid applicant ID.')
    }

    return applicantCollection().find({ scholarship, applicant }).toArray()
        .then(items => items)
        .catch((err) => {
            console.log(err)
            return []
        })
}

export function createApplication({ data = new ApplicationModel(), user = '', attachments = [] } = {}) {
    const session = Database.client().startSession();
    const transactionOptions = {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
    };

    return session.withTransaction(async () => {

        data.date = new Date();
        data.lastModified = new Date();
        try {
            data.scholarship = new ObjectId(data.scholarship);
        } catch (error) {
            return Promise.reject('Invalid scholarship ID.')
        }

        try {
            data.applicant = new ObjectId(data.applicant);
        } catch (error) {
            return Promise.reject('Invalid applicant ID.')
        }

        try {
            user = new ObjectId(user);
        } catch (error) {
            return Promise.reject('Invalid user ID.')
        }

        const applicant = await Database.instance().collection('users').findOne({ _id: user }).catch(() => ({}))

        if (applicant && applicant.type == 'sponsor') {
            return Promise.reject('Sponsors are not allowed to apply for scholarships!')
        }

        const applications = await applicantCollection().countDocuments({ scholarship: data.scholarship, applicant: data.applicant, status: 'pending' })

        if (applications) return Promise.reject(`You already have a pending application.`)

        const approvedApplication = await applicantCollection().countDocuments({ scholarship: data.scholarship, applicant: data.applicant, status: 'approved' })

        if (approvedApplication) return Promise.reject(`Your application has already been approved.`)

        const insertResult = await applicantCollection()
            .insertOne(data)
            .catch(() => Promise.reject('Failed to create applicant.'));


        for (let index = 0; index < attachments.length; index++) {
            const { buffer, originalname, mimetype } = attachments[index];

            await createFile({ data: buffer, name: originalname, type: mimetype, directory: `${applicant.type}s/attachments/${insertResult.insertedId}` })
                .then(() => console.log(`Successfully uploaded file, ${originalname}.`))
                .catch(() => Promise.reject(`Failed to upload attachment ${originalname}.`))

            await applicantCollection()
                .updateOne({ _id: insertResult.insertedId }, { $push: { attachments: `${applicant.type}s/attachments/${insertResult.insertedId}/${originalname}` } }, { session })
                .catch(() => Promise.reject('Failed to push attachments.'))
        }


        sendMail({
            to: applicant.email,
            subject: "Scholarship Application",
            text: `Successfully submitted your application for scholarship ID ${insertResult.insertedId}.`,
            html: `<h1>Successfully submitted your application for scholarship ID ${insertResult.insertedId}.</h1>`
        })
            .then(() => console.log('Email sent!'))
            .catch(err => {
                console.log(err)
                return Promise.reject('Failed to send email on application update.')
            })



    }, transactionOptions)
        .then(() => {
            session.endSession();
            return 'Successfully created application.'
        })
        .catch(err => {
            console.log(err);
            session.endSession();
            return Promise.reject(err)
        })
}

export function updateApplication(application = new ApplicationModel()) {
    const session = Database.client().startSession();
    const transactionOptions = {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
    };

    return session.withTransaction(async () => {

        let _id = application._id;
        delete application._id;

        try {
            _id = new ObjectId(_id)
        } catch (error) {
            return Promise.reject('Invalid ID.')
        }

        const instance = Database.instance();

        const originalApplication = await applicantCollection().findOne({ _id }) || new ApplicationModel();

        const applicant = await instance.collection('users').findOne({ _id: originalApplication.applicant }) || new UserModel();

        if (originalApplication.status !== applicant.status && application.status == 'approved') {
            const scholarship = await instance.collection('scholarships').findOne({ _id: originalApplication.scholarship }) || new ScholarshipModel();
            const approvedApplicants = await applicantCollection().countDocuments({ scholarship: originalApplication.scholarship, status: 'approved' });

            if (approvedApplicants >= scholarship.limit) {
                return Promise.reject('Failed to approve application, scholarship slot is full.')
            }
        }

        await applicantCollection()
            .updateOne({ _id }, { $set: application }, { session })
            .catch(err => {
                console.log(err)
                return Promise.reject('Failed to update application.')
            })

        if (originalApplication.status !== application.status && applicant._id) {
            sendMail({
                to: applicant.email,
                subject: application.status == 'eliminated' ? 'Scholarship Elimination' : 'Application Update!',
                text: application.status == 'eliminated' ? `You have been eliminated from scholarship ID ${originalApplication.scholarship}.` : `Your application for scholarship ID ${originalApplication.scholarship} have been ${application.status}.`,
                html: application.status == 'eliminated' ? `<h1>You have been eliminated from scholarship ID ${originalApplication.scholarship}.</h1>` : `<h1>Your application for scholarship ID ${originalApplication.scholarship} have been ${application.status}.</h1>`
            })
                .then(() => console.log('Email sent!'))
                .catch(err => {
                    console.log(err)
                    return Promise.reject('Failed to send email on application update.')
                })
        }

    }, transactionOptions)
        .then(() => {
            session.endSession();
            return 'Successfully updated application.'
        })
        .catch(err => {
            session.endSession();
            return Promise.reject(err)
        })
}
