const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const School = require('../models/School');
const Location = require('../models/Location');

// Helper to convert DMS to Decimal Degrees if needed
function dmsToDecimal(deg, min, sec) {
    return deg + min / 60 + sec / 3600;
}

// 8 School locations with both original DMS string and exact decimal coordinates
const schoolUpdates = [
    {
        names: ['Nirgu Bhume Basic School', 'NirguBhumi', 'Nirgu Bhumi'],
        area: 'Semrang',
        dms: '27°58\'26.7"N 85°17\'31.8"E',
        lat: dmsToDecimal(27, 58, 26.7), // 27.974083333333333
        lng: dmsToDecimal(85, 17, 31.8), // 85.29216666666666
    },
    {
        names: ['Shree Dudhe Devi Secondary School', 'Shree Dudhedevi Secondary School', 'Dudhedevi Secondary School'],
        area: 'Jongdada',
        dms: '27.96150824289415, 85.29407112293492',
        lat: 27.96150824289415,
        lng: 85.29407112293492,
    },
    {
        names: ['Lachen Basic School', 'Lachyang', 'Lachyang Basic School'],
        area: 'Solamane',
        dms: '27°57\'50.6"N 85°17\'14.8"E',
        lat: dmsToDecimal(27, 57, 50.6), // 27.964055555555554
        lng: dmsToDecimal(85, 17, 14.8), // 85.28744444444445
    },
    {
        names: ['Jana Sakti Basic School', 'Jana Shakti', 'Jana Shakti Basic School', 'Janasakti Basic School'],
        area: '',
        dms: '27°58\'26.7"N 85°17\'31.8"E',
        lat: dmsToDecimal(27, 58, 26.7), // 27.974083333333333
        lng: dmsToDecimal(85, 17, 31.8), // 85.29216666666666
    },
    {
        names: ['Shree Mangala Devi School', 'Mangala Devi School'],
        area: 'Chaap (Bore)',
        dms: '27.953881857768977, 85.2738286829179',
        lat: 27.953881857768977,
        lng: 85.2738286829179,
    },
    {
        names: ['Kalika Devi Basic School', 'Kalika Devi'],
        area: 'Lachyang',
        dms: '27.946491, 85.289960',
        lat: 27.946491,
        lng: 85.28996,
    },
    {
        names: ['Mahakali Basic School', 'Mahakali school', 'Mahakali School'],
        area: 'Ditha Saura',
        dms: '27°58\'00.6"N 85°15\'42.9"E',
        lat: dmsToDecimal(27, 58, 0.6), // 27.96683333333333
        lng: dmsToDecimal(85, 15, 42.9), // 85.26191666666666
    },
    {
        names: ['Gauri Shankar', 'Gauri Shankar Basic School'],
        area: 'Sano Bhorle',
        dms: '27°57\'50.6"N 85°17\'14.8"E',
        lat: dmsToDecimal(27, 57, 50.6), // 27.964055555555554
        lng: dmsToDecimal(85, 17, 14.8), // 85.28744444444445
    },
];

async function updateLocations() {
    if (!process.env.MONGODB_URI) {
        console.error('Error: MONGODB_URI is not set in environment.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.\n');

        let updatedSchools = 0;
        let updatedLocations = 0;

        for (const target of schoolUpdates) {
            console.log(`--- Processing: ${target.names[0]} ---`);
            console.log(`Coordinates: Lat ${target.lat}, Lng ${target.lng} (${target.dms})`);

            // Build regex query matching any alias
            const nameRegexes = target.names.map(
                (n) => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
            );
            const query = { $or: target.names.map((n) => ({ name: new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })) };

            // 1. Update School collection
            const matchedSchools = await School.find(query);
            if (matchedSchools.length > 0) {
                for (const s of matchedSchools) {
                    const oldCoords = `${s.lat}, ${s.lng}`;
                    s.lat = target.lat;
                    s.lng = target.lng;
                    if (target.area && !s.area) s.area = target.area;
                    await s.save();
                    updatedSchools++;
                    console.log(` [School] Updated "${s.name}": [${oldCoords}] -> [${s.lat}, ${s.lng}]`);
                }
            } else {
                console.log(` [School] No existing record found for: ${target.names.join(' / ')}. Creating new record...`);
                await School.create({
                    name: target.names[0],
                    area: target.area || '',
                    lat: target.lat,
                    lng: target.lng,
                    progressPercent: 0,
                    milestones: [],
                    photos: [],
                });
                updatedSchools++;
                console.log(` [School] Created "${target.names[0]}": [${target.lat}, ${target.lng}]`);
            }

            // 2. Update Location collection (used by Project Maps)
            const matchedLocations = await Location.find(query);
            if (matchedLocations.length > 0) {
                for (const loc of matchedLocations) {
                    const oldCoords = `${loc.lat}, ${loc.lng}`;
                    loc.lat = target.lat;
                    loc.lng = target.lng;
                    if (target.area && !loc.area) loc.area = target.area;
                    await loc.save();
                    updatedLocations++;
                    console.log(` [Location] Updated "${loc.name}": [${oldCoords}] -> [${loc.lat}, ${loc.lng}]`);
                }
            } else {
                console.log(` [Location] Note: No location document matched for ${target.names[0]}`);
            }
            console.log('');
        }

        console.log(`Done! Total School records updated/created: ${updatedSchools}`);
        console.log(`Total Location records updated: ${updatedLocations}`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    } catch (err) {
        console.error('Update failed:', err);
        process.exit(1);
    }
}

updateLocations();
