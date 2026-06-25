'use client';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts for better look
Font.register({
  family: 'Barlow',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/barlow/v12/7cHpv4kjgoGqM7E_A8s52Hs.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/barlow/v12/7cHqv4kjgoGqM7E3-0s51a4.ttf', fontWeight: 700 },
  ],
});

// Color palette from brochure
const colors = {
  primary: '#0b1f3a',    // dark blue
  secondary: '#1a6b3c',  // green
  lightBg: '#f8fafc',
  border: '#e8edf3',
  text: '#0b1f3a',
  textLight: '#5a6e82',
};

const styles = StyleSheet.create({
  page: {
    padding: 35,
    backgroundColor: '#ffffff',
    fontFamily: 'Barlow',
  },
  header: {
    marginBottom: 25,
    borderBottom: `2px solid ${colors.secondary}`,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  companyTagline: {
    fontSize: 10,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2,
  },
  headerRight: {
    fontSize: 9,
    color: colors.textLight,
    textAlign: 'right',
  },
  productBlock: {
    marginBottom: 18,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  productName: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  productDesc: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 8,
  },
  specsTable: {
    width: '100%',
    marginTop: 4,
  },
  specRow: {
    flexDirection: 'row',
    borderBottom: `1px solid ${colors.border}`,
    paddingVertical: 3,
  },
  specKey: {
    width: '40%',
    fontSize: 9,
    color: colors.textLight,
    fontWeight: 400,
  },
  specValue: {
    width: '60%',
    fontSize: 9,
    color: colors.text,
    fontWeight: 700,
  },
  footer: {
    marginTop: 30,
    borderTop: `1px solid ${colors.border}`,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: colors.textLight,
  },
  footerContact: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  pageNumber: {
    fontSize: 8,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
});

export function CatalogPDF({ company, products }: { company: any; products: any[] }) {
  // Fallback if company data missing
  const companyName = company?.name || 'Showcase AI';
  const companyEmail = company?.email || 'sales@showcaseai.com';
  const companyPhone = company?.phone || '+91 98765 00000';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyTagline}>Product Catalog – Interactive Showcase</Text>
          </View>
          <View style={styles.headerRight}>
            <Text>Generated: {new Date().toLocaleDateString('en-IN')}</Text>
          </View>
        </View>

        {/* Product List */}
        {products.map((product) => (
          <View key={product.id} style={styles.productBlock}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDesc}>{product.description || ''}</Text>

            {/* Specifications Table */}
            <View style={styles.specsTable}>
              {Object.entries(product.specs || {}).map(([key, value]) => (
                <View key={key} style={styles.specRow}>
                  <Text style={styles.specKey}>{key}</Text>
                  <Text style={styles.specValue}>{value as string}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text>© {new Date().getFullYear()} {companyName}. All rights reserved.</Text>
          </View>
          <View style={styles.footerContact}>
            <Text>{companyEmail}</Text>
            <Text>{companyPhone}</Text>
          </View>
        </View>

        {/* Page number (optional) */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
}