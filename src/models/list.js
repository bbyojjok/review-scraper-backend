import mongoose from 'mongoose';

const { Schema } = mongoose;

const ListSchema = new Schema({
  name: { type: String, required: true },
  googlePlayAppId: String,
  appStoreId: Number,
  googlePlay: Schema.Types.Mixed,
  appStore: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now() },
});

const List = mongoose.model('list', ListSchema);

export default List;
