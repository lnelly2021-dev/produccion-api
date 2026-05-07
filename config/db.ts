import mongoose from "mongoose";

/**
 * Conexión principal a MongoDB.
 * La URI se toma desde la variable de entorno MONGO_URI (ver .env.example).
 *
 * Si necesitas múltiples bases de datos, replica este patrón en otro
 * archivo (por ejemplo, secondary.db.ts) usando mongoose.createConnection().
 */
const connectToDatabase = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error("MONGO_URI no está definida en el entorno.");
    }

    const connection = await mongoose.connect(mongoURI);
    console.log(`🟢 MongoDB conectado: ${connection.connection.host}`);
  } catch (error) {
    console.error(
      `Error al conectar con MongoDB: ${(error as Error).message}`
    );
    process.exit(1);
  }
};

export default connectToDatabase;
