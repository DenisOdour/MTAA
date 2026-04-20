const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  username:         { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone:            { type: String, required: true, unique: true, trim: true },
  email:            { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  password:         { type: String, required: true, minlength: 6, select: false },
  avatar:           { type: String, default: '' },
  area:             { type: String, required: true, default: 'Nairobi' },
  role:             { type: String, enum: ['user', 'admin', 'super_admin'], default: 'user' },
  adminCategories:  [{ type: String }],
  isVerified:       { type: Boolean, default: false },
  isActive:         { type: Boolean, default: true },
  isBanned:         { type: Boolean, default: false },
  bio:              { type: String, default: '', maxlength: 300 },
  skills:           [{ type: String }],

  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [36.8219, -1.2921] }
  },
  locationUpdatedAt: Date,
  shareLocation: { type: Boolean, default: false },

  postsCount:    { type: Number, default: 0 },
  followersCount:{ type: Number, default: 0 },
  followingCount:{ type: Number, default: 0 },
  followers:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  subscription: {
    plan:      { type: String, enum: ['free', 'basic', 'standard', 'premium', 'admin'], default: 'free' },
    expiresAt: Date,
    mpesaRef:  String
  },

  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  savedJobs:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],

  pushToken: String,
  lastSeen:  { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });
userSchema.index({ phone: 1 });
userSchema.index({ username: 1 });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
