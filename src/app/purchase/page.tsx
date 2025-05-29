// src/app/purchase/page.tsx
import { Metadata } from 'next';
import PurchaseView from './PurchaseView';

export const metadata: Metadata = {
  title: 'Purchase Logo Credits',
  description: 'Purchase logo credits for the AI Logo Generator',
};

export default function PurchasePage() {
  return <PurchaseView />;
}