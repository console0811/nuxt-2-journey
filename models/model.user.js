export class ParentModel {
    constructor({
        name = "",
        contactNumber = "",
        occupation = ""
    } = {}) {
        this.name = name;
        this.contactNumber = contactNumber;
        this.occupation = occupation;
    }
}

export class UserOptionsModel {
    constructor({ } = {}) {
        this.levelOfEducations = [{ text: 'Senior High', value: 'senior high' }, { text: 'College', value: 'college' }]
    }
}
export default class UserModel {
    constructor({
        _id = '',
        name = [],
        organization = "",
        email = "",
        password = "",
        contactNumber = "",
        dateOfBirth = "",
        address = "",
        mother = new ParentModel(),
        father = new ParentModel(),
        gwa = "",
        levelOfEducation = "",
        collegeCourse = "",
        yearLevel = "",
        existingScholarship = false,
        type = "",
        tin = "",
        profile = "",
        background = "",
        attachments = []
    } = {}) {
        this._id = _id;
        this.name = name;
        this.organization = organization;
        this.email = email;
        this.password = password;
        this.contactNumber = contactNumber;
        this.dateOfBirth = dateOfBirth;
        this.address = address;
        this.mother = mother;
        this.father = father;
        this.gwa = gwa;
        this.levelOfEducation = levelOfEducation
        this.collegeCourse = collegeCourse;
        this.yearLevel = yearLevel;
        this.existingScholarship = existingScholarship;
        this.type = type;
        this.tin = tin;
        this.background = background;
        this.profile = profile;
        this.attachments = attachments
    }
}