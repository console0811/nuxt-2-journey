import { ObjectId } from "mongodb";
import ScholarshipModel from "../../models/model.scholarship"
import Database from "../services/service.database"

export function scholarshipCollection() {
    return Database.instance().collection('scholarships')
}

export function createScholarship({ data = new ScholarshipModel() }) {
    data.date = new Date();
    data.lastModified = new Date();
    try {
        data.createdBy = new ObjectId(data.createdBy);
    } catch (error) {
        return Promise.reject('Invalid createdBy ID.')
    }
    return scholarshipCollection()
        .insertOne(data)
        .then(() => 'Successfully created scholarship offer.')
        .catch(() => Promise.reject('Failed to create scholarship.'))
}

export function updateScholarship({ data = new ScholarshipModel() }) {
    data.lastModified = new Date();
    let _id = data._id;
    delete data._id;
    try {
        _id = new ObjectId(_id);
    } catch (error) {
        return Promise.reject('Invalid ID.')
    }

    try {
        data.createdBy = new ObjectId(data.createdBy);
    } catch (error) {
        return Promise.reject('Invalid createdBy ID.')
    }
    return scholarshipCollection()
        .updateOne({ _id }, { $set: data })
        .then(() => 'Successfully updated scholarship offer.')
        .catch(() => Promise.reject('Failed to update scholarship.'))
}

function pineLine({ skip = 0, limit = 10, sort = { _id: 1 }, search = "", createdBy = "" } = {}) {
    let match = {
        '$match': {

            $or: [
                { course: new RegExp(search, 'i') },
                { date: new RegExp(search, 'i') },
                { limit: new RegExp(search, 'i') },
                { cutOff: new RegExp(search, 'i') },
                { descriptions: new RegExp(search, 'i') }
            ]
        }
    };
    if (createdBy) match.$match.createdBy = new ObjectId(createdBy)
    return [
        match
        , {
            '$sort': sort
        }, {
            '$skip': skip * limit
        }, {
            '$limit': limit
        },
        {
            '$lookup': {
                'from': 'applicants',
                'localField': '_id',
                'foreignField': 'scholarship',
                'as': 'applicants'
            }
        },
        {
            '$lookup': {
                'from': 'users',
                'localField': 'createdBy',
                'foreignField': '_id',
                'as': 'sponsor'
            }
        },
        { $unwind: { path: "$sponsor", preserveNullAndEmptyArrays: true } },
        {
            '$project': {
                'applicants': {
                    '$size': {
                        '$filter': {
                            'input': "$applicants",
                            'as': "applicant",
                            'cond': { '$eq': ["$$applicant.status", "approved"] }
                        }
                    }
                },
                '_id': 1,
                'cover': '$sponsor.profile',
                'organization': '$sponsor.organization',
                'course': 1,
                'date': 1,
                'descriptions': 1,
                'limit': 1,
                'createdBy': 1,
                'status': 1,
                'lastModified': 1,
                'cutOff': 1,
                'title': 1
            }
        }
    ]
}

export async function getScholarships({ skip = 0, limit = 10, sort = { _id: 1 }, user = "", search = "", type = "" } = {}) {
    const pipe = pineLine({
        skip,
        limit,
        sort,
        search,
        createdBy: type == 'sponsor' ? user : ''
    })

    const items = await scholarshipCollection()
        .aggregate(pipe)
        .toArray()
        .catch((err) => {
            console.log(err);
            return []
        })

    const length = await scholarshipCollection()
        .countDocuments(pipe[0].$match)
        .catch(err => {
            console.log(err)
            return 0
        })

    return { items, length }
}

export async function getScholarship(_id = '') {
    try {
        _id = new ObjectId(_id)
    } catch (error) {
        return Promise.reject('Invalid ID.')
    }

    const scholarship = await scholarshipCollection().findOne({ _id })
        .then(async data => {
            data.applicants = await Database.instance().collection('applicants').countDocuments({ scholarship: _id, status: 'approved' })
            return data;
        }).catch(() => ({}))
    return scholarship;
}