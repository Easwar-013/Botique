import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      'mongodb://127.0.0.1:27017/hangover_boutique';

    const conn = await mongoose.connect(mongoUri);

    console.log(
      `[Database] MongoDB Connected: ${conn.connection.host}`
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown database error';

    console.error(`[Database Error] ${message}`);
    process.exit(1);
  }
};