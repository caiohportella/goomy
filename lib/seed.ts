import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";

import * as FileSystem from "expo-file-system";

interface Category {
  name: string;
  description: string;
}

interface Customization {
  name: string;
  price: number;
  type: "topping" | "side" | "size" | "crust" | string; // extend as needed
}

interface MenuItem {
  name: string;
  description: string;
  image_url: string;
  price: number;
  rating: number;
  calories: number;
  protein: number;
  category_name: string;
  customizations: string[]; // list of customization names
}

interface DummyData {
  categories: Category[];
  customizations: Customization[];
  menu: MenuItem[];
}

// ensure dummyData has correct shape
const data = dummyData as DummyData;

async function clearAll(collectionId: string): Promise<void> {
  const list = await databases.listDocuments(
    appwriteConfig.databaseId,
    collectionId
  );

  await Promise.all(
    list.documents.map((doc) =>
      databases.deleteDocument(appwriteConfig.databaseId, collectionId, doc.$id)
    )
  );
}

async function clearStorage(): Promise<void> {
  const list = await storage.listFiles(appwriteConfig.bucketId);

  await Promise.all(
    list.files.map((file) =>
      storage.deleteFile(appwriteConfig.bucketId, file.$id)
    )
  );
}

async function uploadImageToStorage(imageUrl: string): Promise<string> {
  try {
    const fileName = imageUrl.split("/").pop() || `image-${Date.now()}.jpg`;
    const fileUri = FileSystem.documentDirectory + fileName;

    console.log("⬇️ Baixando imagem:", imageUrl);

    const downloadRes = await FileSystem.downloadAsync(imageUrl, fileUri);

    if (downloadRes.status !== 200) {
      throw new Error(`Falha ao baixar a imagem: ${downloadRes.status}`);
    }

    const fileInfo = await FileSystem.getInfoAsync(downloadRes.uri);
    if (!fileInfo.exists || fileInfo.size == null) {
      throw new Error("File does not exist or size is unknown.");
    }

    const file = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      {
        uri: downloadRes.uri,
        name: fileName,
        type: "image/png", // ou inferir dinamicamente
        size: fileInfo.size,
      }
    );

    console.log("✅ Upload done:", file.$id);

    return storage.getFileViewURL(appwriteConfig.bucketId, file.$id).toString();
  } catch (err) {
    console.error("Erro no upload da imagem:", err);
    throw err;
  }
}

async function seed(): Promise<void> {
  console.log("Seeding database...");

  // 1. Clear all
  console.log("🔄 Clearing collection: categories");
  await clearAll(appwriteConfig.categoriesCollectionId);
  console.log("✅ Collection categories clear.");

  console.log("🔄 Clearing collection: customizations");
  await clearAll(appwriteConfig.customizationsCollectionId);
  console.log("✅ Collection customizations clear.");

  console.log("🔄 Clearing collection: menu");
  await clearAll(appwriteConfig.menuCollectionId);
  console.log("✅ Collection menu clear.");

  console.log("🔄 Clearing collection: menuCustomizations");
  await clearAll(appwriteConfig.menuCustomizationsCollectionId);
  console.log("✅ Collection menuCustomizations clear.");

  console.log("🔄 Clearing storage bucket");
  await clearStorage();
  console.log("✅ Storage bucket cleared.");

  console.log("🔄 Creating categories...");
  // 2. Create Categories
  const categoryMap: Record<string, string> = {};
  for (const cat of data.categories) {
    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.categoriesCollectionId,
      ID.unique(),
      cat
    );
    categoryMap[cat.name] = doc.$id;
  }
  console.log("✅ Categories created.");

  console.log("🔄 Creating customizations...");
  // 3. Create Customizations
  const customizationMap: Record<string, string> = {};
  for (const cus of data.customizations) {
    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.customizationsCollectionId,
      ID.unique(),
      {
        name: cus.name,
        price: cus.price,
        type: cus.type,
      }
    );
    customizationMap[cus.name] = doc.$id;
  }
  console.log("✅ Customizations created.");

  console.log("🔄 Creating menu items...");
  // 4. Create Menu Items
  const menuMap: Record<string, string> = {};
  for (const item of data.menu) {
    const uploadedImage = await uploadImageToStorage(item.image_url);
    // const uploadedImage = item.image_url;

    console.log("Creating item:", item.name);

    const doc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.menuCollectionId,
      ID.unique(),
      {
        name: item.name,
        description: item.description,
        image_url: uploadedImage,
        price: item.price,
        rating: item.rating,
        calories: item.calories,
        protein: item.protein,
        categories: categoryMap[item.category_name],
      }
    );

    menuMap[item.name] = doc.$id;

    // 5. Create menu_customizations
    for (const cusName of item.customizations) {
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.menuCustomizationsCollectionId,
        ID.unique(),
        {
          menu: doc.$id,
          customizations: customizationMap[cusName],
        }
      );
    }
  }
  console.log("✅ Menu items created.");

  console.log("✅ Seeding complete.");
}

export default seed;
