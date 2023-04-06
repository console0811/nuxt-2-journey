import express from "express";
import { createApplication, getApplicantByScholarshipStatus, getApplicationByApplicant, updateApplication } from "../controllers/applicant";
const router = express.Router();
import multer from "multer";
const multi = multer()

import authenticate from "../middleware/authenticate";

router.post('/create', authenticate, multi.any(), (req, res) => {
    let { buffer } = req.files.find(i => i.mimetype == 'application/json');
    const data = JSON.parse(buffer.toString())
    const attachments = req.files.filter(i => i.fieldname == 'file');
    console.log(data, attachments);
    return createApplication({ data, user: req.user, attachments })
        .then(message => res.json({ message }))
        .catch(error => res.status(403).json({ error }))
})

router.get('/scholarship/:scholarship/applicant/:applicant', authenticate, (req, res) => {
    const { scholarship, applicant } = req.params;
    return getApplicationByApplicant({ scholarship, applicant })
        .then(data => res.json({ data }))
        .catch(({ data }) => res.status(403).json({ data }))
})

router.get('/:id/:status/', authenticate, (req, res) => {
    const { id, status } = req.params;
    const { search } = req.query;
    return getApplicantByScholarshipStatus({ id, status, search })
        .then(items => res.json(items))
        .catch(items => res.status(403).json(items))
})

router.put('/', authenticate, (req, res) => {
    const { data } = req.body;
    return updateApplication(data)
        .then(message => res.send({ message }))
        .catch(error => res.status(400).send({ error }))
})

export default router;