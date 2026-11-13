require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

async function runSync() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI missing');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const School = require('../models/School');
  const Location = require('../models/Location');

  const locations = await Location.find().lean();
  console.log(`Found ${locations.length} locations in Location collection.`);

  for (const loc of locations) {
    console.log(`Syncing location "${loc.name}"...`);

    const cleanName = loc.name.replace(/\s*(Basic\s+School|Secondary\s+School|School)\s*$/i, '').trim();
    const regex = new RegExp(`^${cleanName}`, 'i');

    const matchedSchool = await School.findOne({
      $or: [
        { name: loc.name },
        { name: { $regex: regex } }
      ]
    });

    if (matchedSchool) {
      // Sync from Location to School
      matchedSchool.name = loc.name;
      matchedSchool.lat = loc.lat;
      matchedSchool.lng = loc.lng;
      if (loc.area) matchedSchool.area = loc.area;
      if (loc.summary) matchedSchool.summary = loc.summary;

      // Extract details from Location
      if (Array.isArray(loc.details) && loc.details.length > 0) {
        for (const d of loc.details) {
          const l = (d.label || '').toLowerCase();
          if (l.includes('student') || l.includes('enrolled')) {
            const parsed = parseInt(d.value, 10);
            if (!isNaN(parsed)) matchedSchool.studentCount = parsed;
          } else if (l.includes('principal') || l.includes('headmaster')) {
            matchedSchool.principalName = d.value;
          } else if (l.includes('contact') || l.includes('phone')) {
            matchedSchool.contact = d.value;
          }
        }
      }

      // Sync photos
      if (loc.photos && loc.photos.length > 0) {
        matchedSchool.photos = loc.photos;
        matchedSchool.photoPublicIds = loc.photoPublicIds || [];
      }

      await matchedSchool.save();
      console.log(`  -> Synced to School: students=${matchedSchool.studentCount}, principal=${matchedSchool.principalName}, contact=${matchedSchool.contact}, photos=${matchedSchool.photos?.length}`);

      // Sync from School to Location (if School had data that Location missed)
      const locDoc = await Location.findById(loc._id);
      if (locDoc) {
        locDoc.details = Array.isArray(locDoc.details) ? locDoc.details : [];
        const existingLabels = new Set(locDoc.details.map(d => (d.label || '').toLowerCase()));

        if (matchedSchool.studentCount != null && !existingLabels.has('students')) {
          locDoc.details.push({ label: 'Students', value: String(matchedSchool.studentCount) });
        }
        if (matchedSchool.principalName && !existingLabels.has('principal')) {
          locDoc.details.push({ label: 'Principal', value: matchedSchool.principalName });
        }
        if (matchedSchool.contact && !existingLabels.has('contact')) {
          locDoc.details.push({ label: 'Contact', value: matchedSchool.contact });
        }
        if ((!locDoc.photos || locDoc.photos.length === 0) && matchedSchool.photos && matchedSchool.photos.length > 0) {
          locDoc.photos = matchedSchool.photos;
          locDoc.photoPublicIds = matchedSchool.photoPublicIds || [];
        }
        await locDoc.save();
      }
    }
  }

  console.log('\n--- VERIFICATION OF BOTH COLLECTIONS ---');
  const allSchools = await School.find().lean();
  console.log(`\nSchools in School collection (${allSchools.length}):`);
  allSchools.forEach(s => console.log(` - ${s.name}: students=${s.studentCount}, principal="${s.principalName}", contact="${s.contact}", photos=${s.photos?.length}`));

  const allLocations = await Location.find().lean();
  console.log(`\nLocations in Location collection (${allLocations.length}):`);
  allLocations.forEach(l => console.log(` - ${l.name}: details=${JSON.stringify(l.details)}, photos=${l.photos?.length}`));

  await mongoose.disconnect();
  console.log('\nDatabase synchronization complete.');
  process.exit(0);
}

runSync().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
