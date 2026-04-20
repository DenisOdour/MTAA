/**
 * MTAA CONNECT - DATABASE SEED SCRIPT
 * Run: node config/seed.js
 * Creates the super admin account + sample data
 */

require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const { Post, Job, Business, SkillCourse, Donation, Report } = require('../models/index');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI || MONGO_URI.includes('YOUR_USERNAME')) {
  console.error('\n❌ ERROR: Please set MONGO_URI in your .env file first!\n');
  console.log('Copy .env.example to .env and fill in your MongoDB Atlas connection string.');
  process.exit(1);
}

async function seed() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!\n');

    // ── 1. Create / update super admin ────────────────────────────
    console.log('👤 Creating super admin: denis254 / denodeno254...');

    const adminData = {
      name:           'Denis Admin',
      username:       'denis254',
      phone:          '+254000000001',
      password:       'denodeno254',
      area:           'Nairobi',
      role:           'super_admin',
      adminCategories:['jobs','stories','businesses','skills','donations','reports'],
      isVerified:     true,
      isActive:       true,
      bio:            'Platform super administrator'
    };

    let admin = await User.findOne({ $or: [{ username: 'denis254' }, { phone: '+254000000001' }] });
    if (admin) {
      // Update fields and set password to trigger pre-save hook
      admin.name = adminData.name;
      admin.username = adminData.username;
      admin.password = adminData.password;
      admin.area = adminData.area;
      admin.role = adminData.role;
      admin.adminCategories = adminData.adminCategories;
      admin.isVerified = adminData.isVerified;
      admin.isActive = adminData.isActive;
      admin.bio = adminData.bio;
      await admin.save();
      console.log('   ✅ Admin updated (password reset to denodeno254)');
    } else {
      admin = await User.create(adminData);
      console.log('   ✅ Admin created!');
    }
    console.log('   Login: username=denis254  OR  phone=+254000000001  |  password=denodeno254\n');

    // ── 2. Sample community users ──────────────────────────────────
    console.log('👥 Creating sample community users...');
    const sampleUsers = [
      { name: 'Amina Wanjiku', phone: '+254700000002', area: 'Kibera',  bio: 'Single mother, tailoring student' },
      { name: 'James Kamau',   phone: '+254700000003', area: 'Mathare', bio: 'Freelance coder, community volunteer' },
      { name: 'Grace Njeri',   phone: '+254700000004', area: 'Korogocho', bio: 'Tailoring mentor & trainer' },
    ];

    const createdUsers = [];
    for (const u of sampleUsers) {
      let existing = await User.findOne({ phone: u.phone });
      if (!existing) {
        existing = await User.create({ ...u, password: 'password123', username: u.name.toLowerCase().replace(/\s+/g,'.') });
        console.log(`   ✅ Created user: ${u.name}`);
      } else {
        console.log(`   ⏭️  User exists: ${u.name}`);
      }
      createdUsers.push(existing);
    }

    // ── 3. Sample approved posts ───────────────────────────────────
    console.log('\n📖 Creating sample posts...');
    const postCount = await Post.countDocuments();
    if (postCount === 0) {
      await Post.insertMany([
        {
          author: createdUsers[0]._id,
          title: 'From the streets of Mathare to a scholarship — my journey',
          content: 'Three years ago I was selling groundnuts on Thika Road to pay school fees. I joined a tailoring class at the Kibera community centre. Last month I received a full scholarship to Nairobi Technical Institute. If I can do it, so can you. Never give up on your dreams no matter where you come from. This platform has connected me to mentors and opportunities I never imagined possible.',
          category: 'story',
          status: 'featured',
          location: { area: 'Kibera' },
          views: 1204,
          shares: 89
        },
        {
          author: createdUsers[1]._id,
          title: 'How I got a coding job from Kibera — step by step',
          content: 'I never thought someone from Kibera could work for a tech company. After three months of learning online through the skills section, I got a part-time data entry job paying KSh 25,000 a month. Here is exactly what I did: 1) Enrolled in the free coding course on this platform. 2) Practiced every day using my phone. 3) Created a profile on Upwork. 4) Applied to 20 jobs in one week. Got my first client on week 2.',
          category: 'motivation',
          status: 'approved',
          location: { area: 'Mathare' },
          views: 892,
          shares: 56
        },
        {
          author: createdUsers[2]._id,
          title: 'Free tailoring classes starting Monday — Kibera Community Centre',
          content: 'I am offering free tailoring classes every Monday, Wednesday and Friday from 9am to 12pm at the Kibera Community Centre next to Chief\'s Camp. All equipment provided. This is a 3-month course covering basic stitching, dress-making, and how to start your own tailoring business. Register here or call me directly. Limited to 20 students per batch.',
          category: 'education',
          status: 'approved',
          location: { area: 'Kibera' },
          views: 445,
          shares: 123
        },
        {
          author: admin._id,
          title: 'Drug dealers targeting children near Mji wa Huruma school — community alert',
          content: 'Multiple community members have reported drug dealers approaching children as young as 12 years old near the eastern gate of Mji wa Huruma primary school. We are urging all parents to escort their children to and from school. Community security groups have been notified. A community meeting is scheduled for Saturday at 10am at the community centre. Please spread this message.',
          category: 'anti_drugs',
          status: 'featured',
          isPinned: true,
          location: { area: 'Huruma' },
          views: 2103,
          shares: 487
        },
      ]);
      console.log('   ✅ Sample posts created');
    } else {
      console.log(`   ⏭️  Posts exist (${postCount} found)`);
    }

    // ── 4. Sample jobs ─────────────────────────────────────────────
    console.log('\n💼 Creating sample jobs...');
    const jobCount = await Job.countDocuments();
    if (jobCount === 0) {
      await Job.insertMany([
        { postedBy: admin._id, title: 'House Cleaning — Lavington', description: 'Need 2 cleaners for a thorough house clean. Equipment provided. Fare included.', category: 'cleaning', location: 'Lavington, Nairobi', pay: 'KSh 1,200/day', payType: 'daily', slots: 2, contact: '+254700111222', tier: 'featured', status: 'active' },
        { postedBy: admin._id, title: 'Construction Workers — Ruaka Site', description: 'Site foreman and 8 fundis needed. Experience with bricklaying preferred. Transport from CBD provided.', category: 'construction', location: 'Ruaka, Nairobi', pay: 'KSh 800–2,500/day', payType: 'daily', slots: 9, contact: '+254700333444', tier: 'sponsored', status: 'active' },
        { postedBy: admin._id, title: 'Househelp — Stay-In, Kileleshwa', description: 'Family of 3 seeking reliable househelp. Cooking and childcare. Own room and meals provided. References required.', category: 'househelp', location: 'Kileleshwa, Nairobi', pay: 'KSh 12,000/month', payType: 'monthly', slots: 1, contact: '+254700555666', status: 'active' },
        { postedBy: admin._id, title: 'Security Guard — Night Shift', description: 'Looking for a reliable security guard for residential apartment. KK Security or similar certification preferred.', category: 'security', location: 'South B, Nairobi', pay: 'KSh 18,000/month', payType: 'monthly', slots: 1, contact: '+254700777888', status: 'active' },
        { postedBy: admin._id, title: 'Casual Workers — Warehouse Loading', description: 'Need 5 casual workers for warehouse loading/offloading. Work starts Monday 7am. Daily payment.', category: 'casual', location: 'Industrial Area, Nairobi', pay: 'KSh 700/day', payType: 'daily', slots: 5, contact: '+254700999000', status: 'active' },
      ]);
      console.log('   ✅ Sample jobs created');
    } else {
      console.log(`   ⏭️  Jobs exist (${jobCount} found)`);
    }

    // ── 5. Sample businesses ───────────────────────────────────────
    console.log('\n🏪 Creating sample businesses...');
    const bizCount = await Business.countDocuments();
    if (bizCount === 0) {
      await Business.insertMany([
        { owner: admin._id, name: 'Hair Palace — Salon & Beauty', category: 'salon', description: 'Professional hair styling, braiding, and beauty services.', location: 'Kibera, Nairobi', phone: '+254711000001', plan: 'premium', isVerified: true, isActive: true, averageRating: 4.8, reviewCount: 134 },
        { owner: admin._id, name: "Mama Pima's Kitchen", category: 'food', description: 'Delicious home-cooked meals. Githeri, ugali, pilau and fresh juice daily.', location: 'Mathare, Nairobi', phone: '+254711000002', plan: 'standard', isVerified: true, isActive: true, averageRating: 4.6, reviewCount: 89 },
        { owner: admin._id, name: 'TechFix Phone Repair', category: 'tech', description: 'Fast and affordable phone repairs. Screen replacement, charging ports, software issues.', location: 'Korogocho, Nairobi', phone: '+254711000003', plan: 'premium', isVerified: true, isActive: true, averageRating: 4.9, reviewCount: 202 },
        { owner: admin._id, name: 'Sharp Cuts Barbershop', category: 'barbershop', description: 'Clean cuts, beard trims and skin fades. Walk-ins welcome.', location: 'Mukuru, Nairobi', phone: '+254711000004', plan: 'basic', isVerified: true, isActive: true, averageRating: 4.7, reviewCount: 67 },
      ]);
      console.log('   ✅ Sample businesses created');
    } else {
      console.log(`   ⏭️  Businesses exist (${bizCount} found)`);
    }

    // ── 6. Sample skill courses ────────────────────────────────────
    console.log('\n🎓 Creating sample courses...');
    const courseCount = await SkillCourse.countDocuments();
    if (courseCount === 0) {
      await SkillCourse.insertMany([
        { title: 'Tailoring & Fashion Business', category: 'tailoring', type: 'mixed', isFree: true, description: 'Learn to sew, design and start your own tailoring business from scratch.', instructorName: 'Grace Njeri', instructor: createdUsers[2]._id, enrollCount: 234, rating: 4.8, location: 'Kibera Community Centre', schedule: 'Mon, Wed, Fri 9am–12pm', isActive: true, videos: [{ title: 'Introduction to sewing machines', duration: '15 min' }, { title: 'Basic stitching techniques', duration: '22 min' }, { title: 'Taking body measurements', duration: '18 min' }] },
        { title: 'Coding & Freelancing with Your Phone', category: 'coding', type: 'video', isFree: true, description: 'Start a tech career using only a smartphone. HTML, CSS, Fiverr & Upwork.', instructorName: 'James Kamau', instructor: createdUsers[1]._id, enrollCount: 567, rating: 4.9, schedule: 'Self-paced online', isActive: true, videos: [{ title: 'Setting up your coding environment', duration: '12 min' }, { title: 'Your first website in 30 minutes', duration: '28 min' }, { title: 'Landing your first freelance client', duration: '35 min' }] },
        { title: 'Baking & Food Business', category: 'baking', type: 'physical', isFree: true, description: 'From mandazis to cakes — learn baking and how to sell locally and online.', instructorName: 'Mary Akinyi', enrollCount: 189, rating: 4.7, location: 'Mathare Training Kitchen', schedule: 'Saturdays 10am–2pm', isActive: true, videos: [] },
        { title: 'Online Work — Data Entry & Virtual Assistant', category: 'online_work', type: 'video', isFree: true, description: 'Find remote jobs earning KSh 20,000–50,000/month from home.', instructorName: 'Esther Wangari', enrollCount: 341, rating: 4.7, schedule: 'Self-paced', isActive: true, videos: [{ title: 'Creating your Upwork profile', duration: '20 min' }, { title: 'Data entry jobs — beginner guide', duration: '25 min' }] },
        { title: 'Carpentry & Furniture Making', category: 'carpentry', type: 'physical', isFree: true, description: 'Woodworking, furniture construction, and how to win home improvement contracts.', instructorName: 'David Omondi', enrollCount: 98, rating: 4.6, location: 'Korogocho Vocational Centre', schedule: 'Tue & Thu 8am–4pm', isActive: true, videos: [] },
      ]);
      console.log('   ✅ Sample courses created');
    } else {
      console.log(`   ⏭️  Courses exist (${courseCount} found)`);
    }

    // ── 7. Sample donation requests ────────────────────────────────
    console.log('\n🤝 Creating sample donation requests...');
    const donationCount = await Donation.countDocuments();
    if (donationCount === 0) {
      await Donation.insertMany([
        { requestedBy: createdUsers[0]._id, area: 'Mukuru kwa Njenga', familySize: 5, situation: 'Mother of 5 lost her job last month. Children are in school but have no food at home. The youngest is 3 years old.', needs: ['food', 'clothes', 'school_supplies'], urgency: 'urgent', status: 'verified', verifiedBy: admin._id },
        { requestedBy: createdUsers[1]._id, area: 'Korogocho', familySize: 3, situation: '8-year-old boy has severe asthma. Mother earns KSh 300/day. Needs inhaler (KSh 1,800) and clinic visit.', needs: ['medicine', 'hospital_fees'], urgency: 'urgent', status: 'verified', verifiedBy: admin._id },
        { isAnonymous: true, area: 'Mathare North', familySize: 7, situation: 'Large family that lost their belongings in a fire last week. Need basic household items and food.', needs: ['food', 'clothes', 'shelter'], urgency: 'urgent', status: 'verified', verifiedBy: admin._id },
      ]);
      console.log('   ✅ Sample donations created');
    } else {
      console.log(`   ⏭️  Donations exist (${donationCount} found)`);
    }

    // ── 8. Sample reports ──────────────────────────────────────────
    console.log('\n📢 Creating sample reports...');
    const reportCount = await Report.countDocuments();
    if (reportCount === 0) {
      await Report.insertMany([
        { reportedBy: createdUsers[0]._id, type: 'garbage', description: 'Huge garbage pile at Kibera Line 7 junction that has been there for 3 weeks.', location: 'Kibera Line 7, Nairobi', status: 'in_progress', isAnonymous: false },
        { isAnonymous: true, type: 'water', description: 'No water for the last 4 days in Mathare North Zone 3. Residents are suffering.', location: 'Mathare North Zone 3', status: 'open' },
        { isAnonymous: true, type: 'drug_hotspot', description: 'Drug dealers operating openly near the primary school gate every evening from 4–7pm.', location: 'Near Korogocho Primary School', status: 'open' },
      ]);
      console.log('   ✅ Sample reports created');
    } else {
      console.log(`   ⏭️  Reports exist (${reportCount} found)`);
    }

    console.log('\n🎉 ════════════════════════════════════════════════');
    console.log('   SEED COMPLETE! Mtaa Connect is ready to run.');
    console.log('════════════════════════════════════════════════\n');
    console.log('📋 ADMIN LOGIN CREDENTIALS:');
    console.log('   Username : denis254');
    console.log('   Password : denodeno254');
    console.log('   (OR use phone: +254000000001)\n');
    console.log('🚀 Start the server: npm run dev\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    if (err.code === 8000 || err.message.includes('authentication')) {
      console.error('   → Check your MONGO_URI username and password in .env');
    }
    process.exit(1);
  }
}

seed();
