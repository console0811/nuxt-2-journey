import express from "express";
import ScholarshipModel from "./../../models/model.scholarship";
import { createScholarship, updateScholarship, getScholarships, getScholarship } from "../controllers/scholarship";
const router = express.Router();

import authenticate from "../middleware/authenticate";

router.get('/', authenticate, async (req, res) => {
    let { page = 0, search = '', type = '' } = req.query;
    page = Number(page);
    page = page ? page - 1 : page;
    search = String(search)
    return getScholarships({ skip: page, search, user: req.user, type })
        .then(data => res.json(data))
        .catch(data => res.json(data))
})

router.get('/:id', authenticate, async (req, res) => {
    let id = req.params.id;
    return getScholarship(id)
        .then((data) => res.json({ data }))
        .catch(error => res.status(403).send({ error }))
})

router.post('/create', authenticate, (req, res) => {
    const { data } = req.body;
    return createScholarship({ data: new ScholarshipModel({ ...data }) })
        .then(message => res.json({ message }))
        .catch(error => res.status(403).json({ error }))
})

router.put('/update', authenticate, (req, res) => {
    const { data } = req.body;
    return updateScholarship({ data })
        .then(message => res.json({ message }))
        .catch(error => res.status(403).json({ error }))
})

export default router;