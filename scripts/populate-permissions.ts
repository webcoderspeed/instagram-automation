/**
 * Script to populate permissions for existing users
 * Run this script to fix users with empty permissions array
 */

import mongoose from 'mongoose';
import { UserModel } from '../src/models/user.model';
import { ROLE_PERMISSIONS, ROLES } from '../src/constants/permissions';

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/postengage';
    await mongoose.connect(mongoURI);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Populate permissions for users
const populatePermissions = async () => {
  try {
    console.log('🔍 Finding users with empty permissions...');
    
    // Find users with empty or missing permissions
    const usersWithoutPermissions = await UserModel.find({
      $or: [
        { permissions: { $exists: false } },
        { permissions: { $size: 0 } }
      ]
    });

    console.log(`📊 Found ${usersWithoutPermissions.length} users without permissions`);

    if (usersWithoutPermissions.length === 0) {
      console.log('✅ All users already have permissions populated');
      return;
    }

    // Role mapping
    const roleMapping: Record<string, keyof typeof ROLE_PERMISSIONS> = {
      [ROLES.SUPER_ADMIN]: 'super_admin',
      [ROLES.ADMIN]: 'admin',
      [ROLES.MANAGER]: 'manager',
      [ROLES.USER]: 'user',
      [ROLES.VIEWER]: 'viewer',
      [ROLES.API_CLIENT]: 'api_client'
    };

    let updatedCount = 0;

    for (const user of usersWithoutPermissions) {
      const permissionRole = roleMapping[user.role as string];
      
      if (permissionRole && ROLE_PERMISSIONS[permissionRole]) {
        user.permissions = [...ROLE_PERMISSIONS[permissionRole]];
        await user.save();
        updatedCount++;
        console.log(`✅ Updated permissions for user: ${user.email} (${user.role})`);
      } else {
        console.log(`⚠️  Unknown role for user: ${user.email} (${user.role})`);
      }
    }

    console.log(`🎉 Successfully updated permissions for ${updatedCount} users`);
    
  } catch (error) {
    console.error('❌ Error populating permissions:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await populatePermissions();
    console.log('🏁 Script completed successfully');
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Database disconnected');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

export { populatePermissions };