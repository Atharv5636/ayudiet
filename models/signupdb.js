const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const signupSchema = new Schema({
    fullname: { // lowercase ✅ matches form
        type: String,
        required: true,
        trim: true
    },
    email: { // lowercase ✅ matches form
        type: String,
        required: true,
         unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please fill a valid email address"
        ]
    },
    phone: { // new field from form
        type: String,
        required: true
    },
    specialization: { // new field
        type: String,
        required: true
    },
    clinic: { // new field
        type: String,
        required: true
    },
    password: { // lowercase ✅ matches form
        type: String,
        required: true,
        minlength: 6
    }
}, { timestamps: true });

// ✅ Hash password before saving
signupSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// ✅ Compare password method
signupSchema.methods.isValidPassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

const userDetails = mongoose.model("User", signupSchema);
module.exports = userDetails;

