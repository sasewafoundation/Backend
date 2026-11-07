const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');
const mongoose = require('mongoose');

const Project = require('../models/Project');
const Location = require('../models/Location');
const School = require('../models/School');

async function migrate() {
    if (!process.env.MONGODB_URI) {
        console.error('Error: MONGODB_URI is not set in environment.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // Load Nuwakot GeoJSON if present
        let nuwakotGeoJSON = null;
        const geojsonPath = path.join(__dirname, '..', 'data', 'nuwakot.geojson');
        if (fs.existsSync(geojsonPath)) {
            try {
                nuwakotGeoJSON = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
                console.log('Loaded Nuwakot GeoJSON boundary.');
            } catch (e) {
                console.warn('Could not parse nuwakot.geojson:', e.message);
            }
        }

        // 1. Find or create the primary School Support / Education Project
        const projectSlug = 'rural-school-support';
        let project = await Project.findOne({
            $or: [
                { slug: projectSlug },
                { title: /School Support|Education Initiative/i }
            ]
        });

        if (!project) {
            console.log('Creating initial School Support project...');
            project = await Project.create({
                title: 'Rural School Support & Reconstruction',
                slug: projectSlug,
                description: 'A dedicated initiative to rebuild and equip rural community schools with infrastructure, learning materials, and clean facilities across remote hilly settlements.',
                summary: 'Rebuilding community schools and equipping students across remote settlements in Nuwakot, Nepal.',
                projectType: 'Education',
                status: 'Active',
                location: 'Nuwakot, Nepal',
                startDate: new Date('2024-01-15'),
                mapSettings: {
                    mapEnabled: true,
                    regionName: 'Nuwakot',
                    regionGeoJSON: nuwakotGeoJSON,
                },
            });
            console.log(`Created Project: "${project.title}" (ID: ${project._id}, Slug: ${project.slug})`);
        } else {
            console.log(`Found existing Project: "${project.title}" (ID: ${project._id}, Slug: ${project.slug})`);
            project.mapSettings = {
                mapEnabled: true,
                regionName: 'Nuwakot',
                regionGeoJSON: nuwakotGeoJSON || project.mapSettings?.regionGeoJSON,
            };
            if (!project.summary) {
                project.summary = 'Rebuilding community schools and equipping students across remote settlements in Nuwakot, Nepal.';
            }
            if (!project.startDate) {
                project.startDate = new Date('2024-01-15');
            }
            await project.save();
            console.log('Updated project map settings to Nuwakot (mapEnabled: true).');
        }

        // 2. Migrate existing School records to Location records
        const schools = await School.find();
        console.log(`Found ${schools.length} schools in the School collection.`);

        let migratedCount = 0;
        let updatedCount = 0;

        for (const school of schools) {
            // Build dynamic details array
            const details = [];
            if (school.studentCount != null) {
                details.push({ label: 'Students', value: `${school.studentCount}` });
            }
            if (school.principalName && school.principalName.trim()) {
                details.push({ label: 'Principal', value: school.principalName.trim() });
            }
            if (school.contact && school.contact.trim()) {
                details.push({ label: 'Contact', value: school.contact.trim() });
            }

            const locationPayload = {
                project: project._id,
                name: school.name,
                area: school.area || '',
                type: 'School',
                lat: school.lat != null ? school.lat : null,
                lng: school.lng != null ? school.lng : null,
                summary: school.summary || '',
                details,
                progressPercent: school.progressPercent || 0,
                milestones: school.milestones || [],
                photos: school.photos || [],
                photoPublicIds: school.photoPublicIds || [],
            };

            const existingLoc = await Location.findOne({
                project: project._id,
                name: school.name,
            });

            if (!existingLoc) {
                await Location.create(locationPayload);
                migratedCount++;
                console.log(`[+] Migrated location: ${school.name}`);
            } else {
                await Location.findByIdAndUpdate(existingLoc._id, locationPayload);
                updatedCount++;
                console.log(`[*] Updated existing location: ${school.name}`);
            }
        }

        console.log(`Migration finished: ${migratedCount} inserted, ${updatedCount} updated.`);
        const totalLocations = await Location.countDocuments({ project: project._id });
        console.log(`Total Locations in project "${project.title}": ${totalLocations}`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
