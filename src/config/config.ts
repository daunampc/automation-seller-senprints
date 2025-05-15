import dotenv from 'dotenv';
dotenv.config();

interface Config {
  email: string;
  password: string;
  productId: string;
  imagePath: string;
  nextcloudShareUrl: string;
  chromePath?: string;
}

export const config: Config = {
  email: process.env.EMAIL || '',
  password: process.env.PASSWORD || '',
  productId: process.env.PRODUCT_ID || '',
  imagePath: process.env.IMAGE_URL || '',
  nextcloudShareUrl: 'https://nnlcloud.com/s/ef2rjZmMFm7eaot'
};

if (!config.email || !config.password) {
  console.error('❌ Missing EMAIL or PASSWORD in .env');
  process.exit(1);
}

