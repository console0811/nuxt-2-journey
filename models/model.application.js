export default class ApplicationModel {
    constructor({
        applicant = '',
        scholarship = '',
        date = new Date(),
        status = 'pending',
        lastModified = new Date(),
        attachments = []
    } = {}) {
        this.applicant = applicant;
        this.scholarship = scholarship;
        this.date = date;
        this.status = status;
        this.lastModified = lastModified;
        this.attachments = attachments
    }
}