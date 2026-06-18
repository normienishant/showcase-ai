// app/product/[id]/page.tsx
import { notFound } from 'next/navigation';
import { mockApi } from '@/lib/mockApi';
import { Metadata } from 'next';
import ClientProductDetail from './client';

// Generate metadata dynamically for SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await mockApi.getProduct(id);
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

// Server component that fetches data and passes to client component
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product;
  let company;

  try {
    product = await mockApi.getProduct(id);
    company = await mockApi.getCompany('bpe');
  } catch (error) {
    notFound();
  }

  return <ClientProductDetail product={product} company={company} />;
}