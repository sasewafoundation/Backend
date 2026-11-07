const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const School = require('../models/School');

const schools = [
    {
        name: 'Shree Mangala Devi School',
        area: 'Chaap (Bore)',
        lat: 27.953881857768977,
        lng: 85.2738286829179,
        studentCount: null,
        principalName: '',
        contact: '',
        summary: '',
        progressPercent: 0,
        milestones: [],
        photos: [],
        photoPublicIds: [],
    },
    {
        name: 'Shree Dudhe Devi Secondary School',
        area: 'Jongdada',
        lat: 27.96150824289415,
        lng: 85.29407112293492,
        studentCount: null,
        principalName: '',
        contact: '',
        summary: '',
        progressPercent: 0,
        milestones: [],
        photos: [],
        photoPublicIds: [],
    },
    {
        name: 'Nirgu Bhume Basic School',
        area: 'Semrang',
        // 27°58'26.7"N 85°17'31.8"E
        lat: 27.974083333333333,
        lng: 85.29216666666666,
        studentCount: null,
        principalName: '',
        contact: '',
        summary: '',
        progressPercent: 0,
        milestones: [],
        photos: [],
        photoPublicIds: [],
    },
    {
        name: 'Gauri Shankar',
        area: 'Sano Bhorle',
        // 27°57'50.6"N 85°17'14.8"E
        lat: 27.964055555555554,
        lng: 85.28744444444445,
        studentCount: null,
        principalName: '',
        contact: '',
        summary: '',
        progressPercent: 0,
        milestones: [],
        photos: [],
        photoPublicIds: [],
    },
    {
        name: 'Lachen Basic School',
        area: 'Solamane',
        // Lachyang: 27°57'50.6"N 85°17'14.8"E
        lat: 27.964055555555554,
        lng: 85.28744444444445,
        studentCount: null,
        principalName: '',
        contact: '',
        summary: '',
        progressPercent: 0,
        milestones: [],
        photos: [],
        photoPublicIds: [],
    },
    {
        name: 'Kalika Devi Basic School',
        area: 'Lachyang',
        lat: 27.946491,
        lng: 85.289960,
        studentCount: null,
        principalName: '',
        contact: '',
        summary: '',
        progressPercent: 0,
        milestones: [],
        photos: [],
        photoPublicIds: [],
    },
    {
        name: 'Jana Sakti Basic School',
        area: '',
        // Jana Shakti: 27°58'26.7"N 85°17'31.8"E
        lat: 27.974083333333333,
        lng: 85.29216666666666,
        studentCount: null,
        principalName: '',
        contact: '',
        summary: '',
        progressPercent: 0,
        milestones: [],
        photos: [],
        photoPublicIds: [],
    },
    {
        name: 'Mahakali Basic School',
        area: 'Ditha Saura',
        // 27°58'00.6"N 85°15'42.9"E
        lat: 27.96683333333333,
        lng: 85.26191666666666,
        studentCount: null,
        principalName: '',
        contact: '',
        summary: '',
        progressPercent: 0,
        milestones: [],
        photos: [],
        photoPublicIds: [],
    },
];

async function seed() {
    if (!process.env.MONGODB_URI) {
        console.error('Error: MONGODB_URI is not defined in environment variables.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        for (const schoolData of schools) {
            const existing = await School.findOne({
                $or: [
                    { name: schoolData.name },
                    { name: new RegExp(`^${schoolData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
                ]
            });
            if (!existing) {
                await School.create(schoolData);
                console.log(`Created: ${schoolData.name}`);
            } else {
                existing.lat = schoolData.lat;
                existing.lng = schoolData.lng;
                if (schoolData.area && !existing.area) {
                    existing.area = schoolData.area;
                }
                await existing.save();
                console.log(`Updated coordinates for: ${existing.name} -> lat: ${existing.lat}, lng: ${existing.lng}`);
            }
        }

        console.log('Seeding and updating completed successfully.');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
