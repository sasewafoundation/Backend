const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Project = require('../models/Project');
const Location = require('../models/Location');

const userNarrative = `Opening Doors to Quality Learning: Scholarship and School Support Project Launches in Lachyang, Nuwakot

We recently launched our foundational education project, the Scholarship and School Support Project, jointly with partners in Lachyang of Suryagadhi Rural Municipality, Nuwakot. It is a community which is nearly 65 km further west from the capital city of Kathmandu. 

Lachyang is home to nearly 1,000 households and eight public schools serving nearly 700 students, most of them from poor and marginalised families. Many of these schools lack basic learning materials, and children often do not have even the essentials, such as books and stationery. The schools also lack a safe, supportive environment where children can thrive. This education initiative was developed to address these needs and to help children in the community continue their education with quality and good access. 

A Day That Brought the Community Together
Local government representatives, school leaders, teachers, parents, and community members gathered in Lachyang to mark the formal launch of the Scholarship and School Support Project. The event showed that improving education takes more than one organization. It takes a community that believes in its children.

Why Lachyang, and Why Now?
Nepal guarantees free and compulsory education, but guarantees on paper do not always become classrooms full of learners. In Lachyang, many children, especially girls, Dalit and Janajati children, and those families, who have low or limited income, still face barriers that keep them from learning.

Subsistence agriculture is the main livelihood here, and food insecurity is key problem. When a family is struggling to get through the season, education can slip down the list of priorities. Children may be pulled out of school to help at home, married early, or sent away in search of work. Many schools, meanwhile, lack safe drinking water, proper sanitation, child-friendly classrooms, and digital learning tools, playful safe ground with playing materials, which makes it harder for children to stay engaged and succeed. 

What the Project Will Do
The project is built on the idea that children learn best when their families, schools, and communities are all supported. Its work includes:

Our Priorities and Key Targets for the Year
- Learning materials: Essential learning items such as copies, pen, eraser, sharpener and digital learning items to 300 children of primary level across Lachyang public schools (including Shree Mangala Devi, Kalika Devi, Nirgu Bhume, Jana Sakti, Lachen, Mahakali, Gauri Shankar, and Shree Dudhe Devi).
- Better school infrastructure: Safer, more welcoming schools, with two schools improved for more than 100 students (including Shree Dudhe Devi Secondary School and Nirgu Bhume Basic School).
- Livelihood support: Easing economic pressure that pushes children out of school by supporting 15-20 low-income families whose children attend school in Lachyang.
- Community participation: Involving parents, school leaders, and local stakeholders in planning, and supporting all 8 schools to update their School Improvement Plans (SIP).
- Stronger local systems: Working with Suryagadhi Rural Municipality Ward 1 on policy and planning that sustain improvements over time.
- Better learning results: Extra coaching for Grade 8 and 10 students at Shree Dudhe Devi Secondary School to improve exam results, and an inter-school science day to encourage the study of science, reaching more than 300 students.

Built on Coordination
Lasting change comes from working alongside the people who live it. The project works closely with the Suryagadhi Rural Municipality, local schools, and community stakeholders. The project and its activities were designed in coordination and consultation with school community and local government and will continue in the years to come. This is just a first year and focussing on its foundation. 

With support from Flowerchain Foundation, Germany, Sa Sewa Foundation is implementing this project in close cooperation with school communities, local government, and other supporters.

Join Us
This launch is only the beginning. In the coming months, we will share progress updates, stories from the community, and the difference this project makes in children’s lives. Follow our journey and stand with the children of Lachyang and beyond.

Want to be part of this journey? Connect with the Sa Sewa Foundation today.`;

const richContentHtml = `
<div class="space-y-8 text-neutral-800 leading-relaxed font-normal">
  <div class="border-l-4 border-primary-600 pl-4 py-1 bg-primary-50/50 rounded-r-xl">
    <p class="text-lg md:text-xl font-medium text-primary-950">
      We recently launched our foundational education project, the <strong>Scholarship and School Support Project</strong>, jointly with partners in <strong>Lachyang of Suryagadhi Rural Municipality, Nuwakot</strong>. It is a community located nearly 65 km west of Kathmandu.
    </p>
  </div>

  <p>
    Lachyang is home to nearly 1,000 households and <strong>eight public schools serving nearly 700 students</strong>, most of them from poor and marginalised families. Many of these schools lack basic learning materials, and children often do not have even the essentials, such as books and stationery. The schools also lack a safe, supportive environment where children can thrive. This education initiative was developed to address these needs and to help children in the community continue their education with quality and good access.
  </p>

  <div class="pt-4">
    <h3 class="text-xl md:text-2xl font-bold text-neutral-900 mb-3 flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-primary-600"></span>
      A Day That Brought the Community Together
    </h3>
    <p>
      Local government representatives, school leaders, teachers, parents, and community members gathered in Lachyang to mark the formal launch of the Scholarship and School Support Project. The event showed that improving education takes more than one organization. It takes a community that believes in its children.
    </p>
  </div>

  <div class="pt-4">
    <h3 class="text-xl md:text-2xl font-bold text-neutral-900 mb-3 flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-primary-600"></span>
      Why Lachyang, and Why Now?
    </h3>
    <p>
      Nepal guarantees free and compulsory education, but guarantees on paper do not always become classrooms full of learners. In Lachyang, many children, especially girls, Dalit and Janajati children, and those families who have low or limited income, still face barriers that keep them from learning.
    </p>
    <p class="mt-3">
      Subsistence agriculture is the main livelihood here, and food insecurity is a key problem. When a family is struggling to get through the season, education can slip down the list of priorities. Children may be pulled out of school to help at home, married early, or sent away in search of work. Many schools, meanwhile, lack safe drinking water, proper sanitation, child-friendly classrooms, and digital learning tools, playful safe ground with playing materials, which makes it harder for children to stay engaged and succeed.
    </p>
  </div>

  <div class="pt-4">
    <h3 class="text-xl md:text-2xl font-bold text-neutral-900 mb-3 flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-primary-600"></span>
      What the Project Will Do
    </h3>
    <p>
      The project is built on the idea that children learn best when their families, schools, and communities are all supported. Its work encompasses targeted educational assistance, school environment enhancement, and household resilience.
    </p>
  </div>

  <div class="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 md:p-8 my-6">
    <h4 class="text-lg md:text-xl font-extrabold text-neutral-900 mb-4 text-primary-800">
      Our Priorities and Key Targets for the Year
    </h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
        <strong class="text-neutral-900 block font-bold mb-1">📚 Learning Materials</strong>
        <p class="text-sm text-neutral-700">Essential learning items such as copies, pen, eraser, sharpener and digital learning items to <strong>300 children of primary level</strong> across public schools in Lachyang (including Shree Mangala Devi, Kalika Devi, Nirgu Bhume, Jana Sakti, Lachen, Mahakali, Gauri Shankar, and Shree Dudhe Devi).</p>
      </div>
      <div class="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
        <strong class="text-neutral-900 block font-bold mb-1">🏫 Better School Infrastructure</strong>
        <p class="text-sm text-neutral-700">Safer, more welcoming schools, with <strong>two schools improved for more than 100 students</strong> (including Shree Dudhe Devi Secondary School and Nirgu Bhume Basic School).</p>
      </div>
      <div class="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
        <strong class="text-neutral-900 block font-bold mb-1">🌱 Livelihood Support</strong>
        <p class="text-sm text-neutral-700">Easing economic pressure that pushes children out of school by supporting <strong>15–20 low-income families</strong> in Lachyang whose children attend local public schools.</p>
      </div>
      <div class="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
        <strong class="text-neutral-900 block font-bold mb-1">🤝 Community Participation</strong>
        <p class="text-sm text-neutral-700">Involving parents, school leaders, and local stakeholders in planning, and supporting all <strong>8 schools</strong> to update and implement their School Improvement Plans (SIP).</p>
      </div>
      <div class="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
        <strong class="text-neutral-900 block font-bold mb-1">🏛️ Stronger Local Systems</strong>
        <p class="text-sm text-neutral-700">Working closely with <strong>Suryagadhi Rural Municipality Ward 1</strong> on education policy, monitoring, and planning that sustain improvements over time.</p>
      </div>
      <div class="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
        <strong class="text-neutral-900 block font-bold mb-1">🎯 Better Learning Results</strong>
        <p class="text-sm text-neutral-700">Extra coaching for Grade 8 and 10 students at <strong>Shree Dudhe Devi Secondary School</strong> to improve exam results, and an inter-school science day reaching <strong>more than 300 students</strong>.</p>
      </div>
    </div>
  </div>

  <div class="pt-4">
    <h3 class="text-xl md:text-2xl font-bold text-neutral-900 mb-3 flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-primary-600"></span>
      Built on Coordination
    </h3>
    <p>
      Lasting change comes from working alongside the people who live it. The project works closely with the <strong>Suryagadhi Rural Municipality</strong>, local schools, and community stakeholders. The project and its activities were designed in coordination and consultation with the school community and local government and will continue in the years to come. This is the first year, focusing on building a solid foundation.
    </p>
    <div class="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 font-medium text-sm">
      With support from <strong>Flowerchain Foundation, Germany</strong>, Sa Sewa Foundation is implementing this project in close cooperation with school communities, local government, and other supporters.
    </div>
  </div>

  <div class="pt-6 border-t border-neutral-200">
    <h3 class="text-xl md:text-2xl font-bold text-neutral-900 mb-2">Join Us</h3>
    <p class="text-neutral-700">
      This launch is only the beginning. In the coming months, we will share progress updates, stories from the community, and the difference this project makes in children’s lives. Follow our journey and stand with the children of Lachyang and beyond.
    </p>
    <p class="mt-3 font-semibold text-primary-700">
      Want to be part of this journey? Connect with the Sa Sewa Foundation today.
    </p>
  </div>
</div>
`;

async function updateProject() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const project = await Project.findOne({
      $or: [
        { slug: 'rural-school-support' },
        { slug: 'scholarship-and-school-support' },
        { _id: '6acb3d5681c15e7cfb129b9c' }
      ]
    });

    if (!project) {
      console.error('Project not found!');
      process.exit(1);
    }

    console.log('Found project:', project.title, '(_id:', project._id, ')');

    project.title = 'Scholarship and School Support Project';
    project.slug = 'scholarship-and-school-support';
    project.legacySlugs = ['rural-school-support'];
    project.location = 'Lachyang, Suryagadhi-1, Nuwakot, Nepal';
    project.startDate = new Date('2026-07-01T00:00:00.000Z');
    project.projectType = 'Education';
    project.status = 'Active';
    project.summary = 'Supporting eight public schools and nearly 700 students with essential learning materials, infrastructure, and livelihood support in Lachyang, Suryagadhi-1, Nuwakot.';
    project.description = userNarrative;
    project.content = richContentHtml;

    if (project.mapSettings) {
      project.mapSettings.mapEnabled = true;
      project.mapSettings.regionName = 'Nuwakot';
    }

    await project.save();
    console.log('Project successfully updated in MongoDB Atlas!');

    // Also update any locations linked to this project to ensure area is Lachyang
    const locResult = await Location.updateMany(
      { project: project._id },
      { $set: { area: 'Lachyang, Suryagadhi-1' } }
    );
    console.log(`Updated ${locResult.modifiedCount} locations.`);

    await mongoose.disconnect();
    console.log('Done.');
  } catch (err) {
    console.error('Error updating project:', err);
    process.exit(1);
  }
}

updateProject();

