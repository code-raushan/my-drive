import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
  },
  isdCode: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  imgURL: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  authProvider: {
    type: String,
    default: 'google'
  }
});

interface IUserModel extends mongoose.Schema {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  isdCode: string;
  phoneNumber: string;
  verified: boolean;
}

const userModel = mongoose.model<IUserModel>('user', userSchema);

export default userModel;