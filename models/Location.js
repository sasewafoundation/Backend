const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Milestone title is required'],
        trim: true,
    },
    done: {
        type: Boolean,
        default: false,
    },
    completedOn: {
        type: Date,
        default: null,
    },
}, { _id: true });

const detailSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true,
        trim: true,
    },
    value: {
        type: String,
        required: true,
        trim: true,
    },
}, { _id: false });

const locationSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project reference is required'],
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Location name is required'],
        trim: true,
    },
    area: {
        type: String,
        default: '',
        trim: true,
    },
    type: {
        type: String,
        default: 'Location',
        trim: true,
    },
    lat: {
        type: Number,
        default: null,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
    },
    lng: {
        type: Number,
        default: null,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
    },
    summary: {
        type: String,
        default: '',
        trim: true,
    },
    details: [detailSchema],
    progressPercent: {
        type: Number,
        default: 0,
        min: [0, 'Progress must be between 0 and 100'],
        max: [100, 'Progress must be between 0 and 100'],
    },
    milestones: [milestoneSchema],
    photos: [{
        type: String,
    }],
    photoPublicIds: [{
        type: String,
    }],
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
