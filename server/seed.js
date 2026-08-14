const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const BloodStock = require('./models/BloodStock');
const DonationHistory = require('./models/DonationHistory');
const BloodRequest = require('./models/BloodRequest');
const StockHistory = require('./models/StockHistory');
const { BLOOD_GROUPS } = require('./models/User');

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloodconnect';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding...');

    await Promise.all([
      User.deleteMany({}),
      BloodStock.deleteMany({}),
      DonationHistory.deleteMany({}),
      BloodRequest.deleteMany({}),
      StockHistory.deleteMany({}),
    ]);

    const admin = await User.create({
      fullName: 'Admin User',
      email: 'admin@bloodconnect.com',
      phone: '9876543210',
      password: 'admin123',
      role: 'admin',
    });

    const donors = [
      { fullName: 'Rahul Sharma', email: 'rahul@email.com', phone: '9876500001', bloodGroup: 'O+', location: 'Hyderabad', gender: 'Male', dateOfBirth: '1995-03-15', isAvailable: true, lastDonationDate: '2025-11-10' },
      { fullName: 'Priya Patel', email: 'priya@email.com', phone: '9876500002', bloodGroup: 'A+', location: 'Mumbai', gender: 'Female', dateOfBirth: '1998-07-22', isAvailable: true, lastDonationDate: '2025-09-05' },
      { fullName: 'Amit Kumar', email: 'amit@email.com', phone: '9876500003', bloodGroup: 'B+', location: 'Delhi', gender: 'Male', dateOfBirth: '1992-11-08', isAvailable: false, lastDonationDate: '2026-01-20' },
      { fullName: 'Sneha Reddy', email: 'sneha@email.com', phone: '9876500004', bloodGroup: 'AB+', location: 'Hyderabad', gender: 'Female', dateOfBirth: '2000-01-30', isAvailable: true },
      { fullName: 'Vikram Singh', email: 'vikram@email.com', phone: '9876500005', bloodGroup: 'O-', location: 'Bangalore', gender: 'Male', dateOfBirth: '1990-05-18', isAvailable: true, lastDonationDate: '2025-12-01' },
      { fullName: 'Ananya Das', email: 'ananya@email.com', phone: '9876500006', bloodGroup: 'A-', location: 'Kolkata', gender: 'Female', dateOfBirth: '1997-09-12', isAvailable: true },
      { fullName: 'Rajesh Nair', email: 'rajesh@email.com', phone: '9876500007', bloodGroup: 'B-', location: 'Chennai', gender: 'Male', dateOfBirth: '1988-12-25', isAvailable: true, lastDonationDate: '2025-08-15' },
      { fullName: 'Meera Joshi', email: 'meera@email.com', phone: '9876500008', bloodGroup: 'AB-', location: 'Pune', gender: 'Female', dateOfBirth: '1996-04-03', isAvailable: false },
    ];

    const createdDonors = [];
    for (const d of donors) {
      const donor = await User.create({ ...d, password: 'donor123', role: 'donor', totalDonations: Math.floor(Math.random() * 5) + 1, livesImpacted: Math.floor(Math.random() * 15) + 3 });
      createdDonors.push(donor);
    }

    const stockData = [
      { bloodGroup: 'A+', availableUnits: 45, reservedUnits: 5, expiredUnits: 2 },
      { bloodGroup: 'A-', availableUnits: 12, reservedUnits: 2, expiredUnits: 1 },
      { bloodGroup: 'B+', availableUnits: 38, reservedUnits: 4, expiredUnits: 3 },
      { bloodGroup: 'B-', availableUnits: 8, reservedUnits: 1, expiredUnits: 0 },
      { bloodGroup: 'AB+', availableUnits: 15, reservedUnits: 2, expiredUnits: 1 },
      { bloodGroup: 'AB-', availableUnits: 4, reservedUnits: 0, expiredUnits: 0 },
      { bloodGroup: 'O+', availableUnits: 52, reservedUnits: 8, expiredUnits: 4 },
      { bloodGroup: 'O-', availableUnits: 18, reservedUnits: 3, expiredUnits: 1 },
    ];
    await BloodStock.insertMany(stockData.map((s) => ({ ...s, updatedBy: admin._id })));

    // Seed Stock History for initial inventory
    for (const s of stockData) {
      await StockHistory.create({
        bloodGroup: s.bloodGroup,
        action: 'Add',
        units: s.availableUnits,
        previousUnits: 0,
        newUnits: s.availableUnits,
        updatedBy: admin._id,
        notes: `Initial stock inventory setup (${s.availableUnits} units)`,
      });
    }

    const hospitals = ['Apollo Hospital', 'Fortis Healthcare', 'Max Hospital', 'AIIMS', 'Care Hospital', 'Yashoda Hospital', 'Narayana Health', 'Manipal Hospital'];
    const donationStatuses = ['Completed', 'Completed', 'Completed', 'Pending'];

    // Create multiple donations per donor for richer history
    for (let i = 0; i < createdDonors.length; i++) {
      const donorDonationCount = 2 + Math.floor(Math.random() * 2); // 2-3 donations each
      for (let j = 0; j < donorDonationCount; j++) {
        const month = Math.max(0, 11 - (j * 3) - Math.floor(Math.random() * 2));
        const day = Math.floor(Math.random() * 28) + 1;
        const units = j === 0 ? 1 : Math.floor(Math.random() * 2) + 1;
        const status = j === 0 && i === 0 ? 'Pending' : donationStatuses[Math.floor(Math.random() * donationStatuses.length)];

        await DonationHistory.create({
          donor: createdDonors[i]._id,
          donationDate: new Date(2025, month, day),
          hospital: hospitals[(i + j) % hospitals.length],
          bloodGroup: createdDonors[i].bloodGroup,
          unitsDonated: units,
          location: createdDonors[i].location,
          status,
          notes: j === 0 ? 'Regular donation' : '',
        });
      }

      await StockHistory.create({
        bloodGroup: createdDonors[i].bloodGroup,
        action: 'Add',
        units: 1,
        previousUnits: 10,
        newUnits: 11,
        updatedBy: admin._id,
        notes: `Donation by ${createdDonors[i].fullName} at ${hospitals[i % hospitals.length]}`,
      });
    }

    // Use future dates so urgent requests remain active
    const futureDate1 = new Date(); futureDate1.setDate(futureDate1.getDate() + 1);
    const futureDate2 = new Date(); futureDate2.setDate(futureDate2.getDate() + 2);
    const futureDate3 = new Date(); futureDate3.setDate(futureDate3.getDate() + 3);
    const futureDate4 = new Date(); futureDate4.setDate(futureDate4.getDate() + 5);
    const futureDate5 = new Date(); futureDate5.setDate(futureDate5.getDate() + 7);

    await BloodRequest.insertMany([
      { patientName: 'Arjun Mehta', bloodGroup: 'O+', unitsRequired: 2, hospitalName: 'Apollo Hospital', location: 'Hyderabad', contactNumber: '9988776655', requiredDate: futureDate1, emergencyLevel: 'Critical', status: 'Pending', additionalMessage: 'Accident victim, immediate need' },
      { patientName: 'Kavitha Rao', bloodGroup: 'A+', unitsRequired: 1, hospitalName: 'Care Hospital', location: 'Hyderabad', contactNumber: '9988776644', requiredDate: futureDate2, emergencyLevel: 'High', status: 'In Progress', additionalMessage: 'Scheduled surgery' },
      { patientName: 'Suresh Babu', bloodGroup: 'B-', unitsRequired: 3, hospitalName: 'Fortis Healthcare', location: 'Bangalore', contactNumber: '9988776633', requiredDate: futureDate1, emergencyLevel: 'Critical', status: 'Pending', additionalMessage: 'Thalassemia patient' },
      { patientName: 'Lakshmi Devi', bloodGroup: 'O-', unitsRequired: 2, hospitalName: 'AIIMS', location: 'Delhi', contactNumber: '9988776622', requiredDate: futureDate2, emergencyLevel: 'Critical', status: 'Pending', additionalMessage: 'Post-operative transfusion' },
      { patientName: 'Mohammed Ali', bloodGroup: 'AB+', unitsRequired: 1, hospitalName: 'Max Hospital', location: 'Delhi', contactNumber: '9988776611', requiredDate: futureDate3, emergencyLevel: 'High', status: 'Pending', additionalMessage: 'Dengue patient, platelet drop' },
      { patientName: 'Deepa Nair', bloodGroup: 'B+', unitsRequired: 2, hospitalName: 'Narayana Health', location: 'Bangalore', contactNumber: '9988776600', requiredDate: futureDate3, emergencyLevel: 'High', status: 'In Progress', additionalMessage: 'Cardiac surgery prep' },
      { patientName: 'Ravi Teja', bloodGroup: 'A-', unitsRequired: 4, hospitalName: 'Yashoda Hospital', location: 'Hyderabad', contactNumber: '9988776599', requiredDate: futureDate4, emergencyLevel: 'Critical', status: 'Pending', additionalMessage: 'Multiple injuries from road accident' },
      { patientName: 'Sunita Verma', bloodGroup: 'O+', unitsRequired: 1, hospitalName: 'Manipal Hospital', location: 'Pune', contactNumber: '9988776588', requiredDate: futureDate5, emergencyLevel: 'High', status: 'Pending', additionalMessage: 'Anemia treatment' },
    ]);

    console.log('Seed completed successfully!');
    console.log('Admin login: admin@bloodconnect.com / admin123');
    console.log('Donor login: rahul@email.com / donor123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
