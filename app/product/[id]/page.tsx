// app/product/[id]/page.tsx — Static Generation for All Products
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { Metadata } from 'next';
import ClientProductDetail from './client';

export async function generateStaticParams() {
  try {
    const company = await api.getCompany('bpe');
    const products = await api.getProducts(company.id);
    return products.map(({ id }) => ({ id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await api.getProduct(id);
    return {
      title: `${product.name} | BPE Product Catalog`,
      description: product.description,
      openGraph: {
        title: product.name,
        description: product.description,
        images: product.images,
      },
    };
  } catch {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product;
  let company;

  try {
    product = await api.getProduct(id);
    company = await api.getCompany('bpe');
  } catch (error) {
    notFound();
  }

  return <ClientProductDetail product={product} company={company} />;
}