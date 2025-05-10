import { Metadata } from 'next';
import HistoryView from './HistoryView';

export const metadata: Metadata = {
  title: 'Logo History',
  description: 'View your generated logos history',
};

// No params needed for this page
export default function HistoryPage() {
  return <HistoryView />;
}