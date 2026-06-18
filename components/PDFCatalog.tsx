// components/PDFCatalog.tsx
'use client';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#ffffff' },
  header: { marginBottom: 20, borderBottom: '2px solid #1a56db', paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a56db' },
  subtitle: { fontSize: 12, color: '#666' },
  productRow: { marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 },
  productName: { fontSize: 14, fontWeight: 'bold' },
  specText: { fontSize: 10, color: '#444', marginTop: 4 },
  footer: { marginTop: 30, fontSize: 10, color: '#888', textAlign: 'center' }
});

export function CatalogPDF({ company, products }: { company: any; products: any[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{company.name}</Text>
          <Text style={styles.subtitle}>Product Catalog - Interactive Showcase</Text>
        </View>
        {products.map(product => (
          <View key={product.id} style={styles.productRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.specText}>{product.description}</Text>
            {Object.entries(product.specs).slice(0, 4).map(([key, val]) => (
              <Text key={key} style={styles.specText}>• {key}: {val}</Text>
            ))}
          </View>
        ))}
        <Text style={styles.footer}>Generated via Showcase AI | {new Date().toLocaleDateString()}</Text>
      </Page>
    </Document>
  );
}