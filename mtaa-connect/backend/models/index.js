const mongoose = require('mongoose');

// ─── POST ─────────────────────────────────────────────────────────
const commentSchema = new mongoose.Schema({
  author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 1000 },
  likes:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, required: true, maxlength: 200 },
  content:  { type: String, required: true, maxlength: 5000 },
  category: { type: String, enum: ['story','jobs','health','education','anti_drugs','community_news','motivation','challenge'], default: 'story' },
  tags:     [String],
  media:    [{ url: String, publicId: String, type: { type: String, enum: ['image','video'] } }],
  status:   { type: String, enum: ['pending','approved','rejected','featured'], default: 'pending' },
  rejectionReason: String,
  featuredAt: Date,
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  shares:   { type: Number, default: 0 },
  views:    { type: Number, default: 0 },
  saves:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  location: { area: String, coordinates: [Number] },
  isAnonymous: { type: Boolean, default: false },
  isPinned:    { type: Boolean, default: false }
}, { timestamps: true });

postSchema.index({ status: 1, createdAt: -1 });

// ─── JOB ──────────────────────────────────────────────────────────
const jobSchema = new mongoose.Schema({
  postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  description: { type: String, required: true },
  category:    { type: String, enum: ['casual','cleaning','construction','househelp','local','driving','security','other'], default: 'casual' },
  location:    { type: String, required: true },
  coordinates: [Number],
  pay:         { type: String, required: true },
  payType:     { type: String, enum: ['daily','weekly','monthly','fixed'], default: 'daily' },
  slots:       { type: Number, default: 1 },
  deadline:    Date,
  contact:     { type: String, required: true },
  requirements:[String],
  tier:        { type: String, enum: ['free','featured','sponsored'], default: 'free' },
  featuredUntil: Date,
  mpesaRef:    String,
  paidAmount:  Number,
  status:      { type: String, enum: ['active','filled','expired','removed'], default: 'active' },
  applicants:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views:       { type: Number, default: 0 }
}, { timestamps: true });

jobSchema.index({ status: 1, tier: -1, createdAt: -1 });

// ─── BUSINESS ─────────────────────────────────────────────────────
const businessSchema = new mongoose.Schema({
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true },
  category:    { type: String, enum: ['salon','barbershop','food','tech','tailoring','hardware','health','transport','other'], default: 'other' },
  description: String,
  location:    { type: String, required: true },
  coordinates: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] },
  phone:       { type: String, required: true },
  openHours:   String,
  photos:      [{ url: String, publicId: String }],
  plan:        { type: String, enum: ['basic','standard','premium'], default: 'basic' },
  planExpiresAt: Date,
  mpesaRef:    String,
  isVerified:  { type: Boolean, default: false },
  isActive:    { type: Boolean, default: false },
  reviews: [{
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating:  { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  reviewCount:   { type: Number, default: 0 },
  views:         { type: Number, default: 0 }
}, { timestamps: true });

businessSchema.index({ coordinates: '2dsphere' });

// ─── DONATION ─────────────────────────────────────────────────────
const donationSchema = new mongoose.Schema({
  requestedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAnonymous:  { type: Boolean, default: false },
  area:         { type: String, required: true },
  familySize:   Number,
  situation:    { type: String, required: true },
  needs:        [{ type: String, enum: ['food','clothes','medicine','school_supplies','hospital_fees','shelter','other'] }],
  urgency:      { type: String, enum: ['low','medium','urgent'], default: 'medium' },
  status:       { type: String, enum: ['pending','verified','fulfilled','closed'], default: 'pending' },
  verifiedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  responses:    [{ ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, message: String, date: Date }]
}, { timestamps: true });

// ─── REPORT ───────────────────────────────────────────────────────
const reportSchema = new mongoose.Schema({
  reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAnonymous: { type: Boolean, default: true },
  type:        { type: String, enum: ['drainage','garbage','water','drug_hotspot','power','road','noise','crime','other'], required: true },
  description: { type: String, required: true },
  location:    { type: String, required: true },
  coordinates: [Number],
  photos:      [{ url: String, publicId: String }],
  status:      { type: String, enum: ['open','in_progress','resolved','closed'], default: 'open' },
  upvotes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  resolution:  String,
  resolvedAt:  Date
}, { timestamps: true });

// ─── EMERGENCY ────────────────────────────────────────────────────
const emergencySchema = new mongoose.Schema({
  triggeredBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:         { type: String, enum: ['violence','fire','medical','missing_child','flood','other'], required: true },
  description:  String,
  location:     String,
  coordinates:  [Number],
  area:         String,
  severity:     { type: String, enum: ['low','medium','high','critical'], default: 'high' },
  status:       { type: String, enum: ['active','responding','resolved'], default: 'active' },
  respondedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  smssSent:     { type: Number, default: 0 },
  resolvedAt:   Date
}, { timestamps: true });

// ─── SAFETY ───────────────────────────────────────────────────────
const safetySchema = new mongoose.Schema({
  reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type:        { type: String, enum: ['domestic_abuse','child_neglect','gbv','child_labour','harassment','other'], required: true },
  location:    { type: String, required: true },
  description: { type: String, required: true },
  contact:     String,
  status:      { type: String, enum: ['new','assigned','in_progress','resolved','closed'], default: 'new' },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:       String,
  isConfidential: { type: Boolean, default: true }
}, { timestamps: true });

// ─── SKILL COURSE ─────────────────────────────────────────────────
const skillCourseSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  category:     { type: String, enum: ['tailoring','coding','carpentry','baking','online_work','masonry','agriculture','beauty','other'] },
  description:  String,
  instructor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  instructorName: String,
  type:         { type: String, enum: ['video','physical','mentor','mixed'], default: 'video' },
  location:     String,
  schedule:     String,
  isFree:       { type: Boolean, default: true },
  price:        { type: Number, default: 0 },
  thumbnail:    String,
  videos:       [{ title: String, url: String, duration: String }],
  enrolled:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  enrollCount:  { type: Number, default: 0 },
  rating:       { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true }
}, { timestamps: true });

// ─── MESSAGE ──────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:   { type: String, required: true },
  isRead:    { type: Boolean, default: false }
}, { timestamps: true });

// ─── NOTIFICATION ─────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['post_approved','job_alert','emergency','message','comment','like','follow','system'] },
  title:     String,
  body:      String,
  link:      String,
  isRead:    { type: Boolean, default: false }
}, { timestamps: true });

// ─── PAYMENT ──────────────────────────────────────────────────────
const paymentSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:      { type: Number, required: true },
  purpose:     { type: String, enum: ['admin_subscription','job_featured','business_listing','course_enrollment','donation'] },
  reference:   String,
  mpesaCode:   String,
  phone:       String,
  mpesaPhone:  String,
  status:      { type: String, enum: ['pending','completed','failed'], default: 'pending' },
  metadata:    mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = {
  Post:         mongoose.model('Post', postSchema),
  Job:          mongoose.model('Job', jobSchema),
  Business:     mongoose.model('Business', businessSchema),
  Donation:     mongoose.model('Donation', donationSchema),
  Report:       mongoose.model('Report', reportSchema),
  Emergency:    mongoose.model('Emergency', emergencySchema),
  Safety:       mongoose.model('Safety', safetySchema),
  SkillCourse:  mongoose.model('SkillCourse', skillCourseSchema),
  Message:      mongoose.model('Message', messageSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Payment:      mongoose.model('Payment', paymentSchema)
};
