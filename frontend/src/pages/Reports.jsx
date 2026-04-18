import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Send, CheckCircle2, Download, Calendar, ArrowRight, Settings2 } from 'lucide-react';
import { fetchItems, fetchHistory } from '../api';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import Modal from '../components/Modal';

export default function Reports() {
  const [searchParams] = useSearchParams();
  const initSummaryMode = searchParams.get('summary') === 'true';
  const [isReportModalOpen, setIsReportModalOpen] = useState(initSummaryMode);
  const [reportStatus, setReportStatus] = useState('idle'); // idle, generating, success
  const [reportConfig, setReportConfig] = useState({ type: 'monthly', range: 'Current Month' });

  const generatePDF = async () => {
    setReportStatus('generating');
    try {
        const [iRes, hRes] = await Promise.all([fetchItems(), fetchHistory()]);
        const items = iRes?.data || [];
        const history = hRes?.data || [];

        if (items.length === 0 && history.length === 0) {
            toast.error('No inventory data found. Please add items before generating a report.');
            setReportStatus('idle');
            return;
        }

        const doc = new jsPDF();
        
        // Helper to load image as base64
        const loadImage = (url) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(null);
            img.src = url;
          });
        };

        const logoData = await loadImage('/logo.png');
        
        // Brand Header (Iten Terracotta)
        doc.setFillColor(163, 94, 69); // #A35E45
        doc.rect(0, 0, 210, 40, 'F');

        if (logoData) {
          doc.addImage(logoData, 'PNG', 15, 8, 24, 24);
        }
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('times', 'bold');
        doc.setFontSize(24);
        doc.text("THE SWISS SIDE", 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text("TRAINING CAMP - ITEN, KENYA", 105, 28, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text("OFFICIAL STOCK MOVEMENT STATEMENT", 14, 55);
        
        const { data: { user } } = await supabase.auth.getUser();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 62);
        doc.text(`Admin: ${user?.email || 'System Administrator'}`, 14, 68);
        doc.text(`Reference: SS-INV-${new Date().getTime().toString().slice(-6)}`, 14, 74);

        // Inventory Table
        autoTable(doc, {
            startY: 85,
            head: [['Item Description', 'Quantity in Stock', 'Status']],
            body: items.map(i => [
              i.name || 'Unknown', 
              `${i.quantity || 0} ${i.unit || ''}`, 
              (i.quantity || 0) <= (i.reorder_level || 0) ? 'REORDER' : 'STABLE'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [163, 94, 69] }, // Brand color
            styles: { fontSize: 9 }
        });

        // Transactions Table
        const finalY = doc.lastAutoTable?.finalY || 85;
        doc.setFont('helvetica', 'bold');
        doc.text("RECENT TRANSACTIONS LOG", 14, finalY + 15);
        autoTable(doc, {
            startY: finalY + 20,
            head: [['Date', 'Type', 'Item Name', 'Qty', 'User']],
            body: history.slice(0, 500).map(h => [
                h.created_at ? new Date(h.created_at).toLocaleDateString() : 'N/A',
                h.type || 'N/A',
                h.item_name || 'Unknown',
                `${h.type === 'RESTOCK' ? '+' : '-'}${h.quantity || 0} ${h.unit || ''}`,
                h.person || 'Unknown'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [44, 44, 44] },
            styles: { fontSize: 8 }
        });

        // Footer Contact Information
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          const pageHeight = doc.internal.pageSize.height;
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text("THE SWISS SIDE ITEN | HIGH ALTITUDE TRAINING CAMP | ELEVATION: 2,394M", 105, pageHeight - 20, { align: 'center' });
          doc.text("Phone: +254 702 000 111 / 0777 699 882 | Email: info@theswissside.com", 105, pageHeight - 15, { align: 'center' });
          doc.text("Address: Kerio Valley Rd, Lilys Area, Iten, Marakwet, Kenya | theswissside.com", 105, pageHeight - 10, { align: 'center' });
        }

        doc.save(`Swiss_Side_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
        setReportStatus('success');
    } catch (err) {
        console.error(err);
        toast.error('Failed to generate statement: ' + err.message);
        setReportStatus('idle');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1>Reports & Statements</h1>
        <p className="text-slate-500 text-sm mt-1">Generate professional inventory manifests and audit logs for Swiss Side Iten.</p>
      </div>

      {/* Simplified Essential Report Section */}
      <div className="max-w-3xl mx-auto py-12">
        <div className="system-card p-10 bg-white border-l-8 border-l-primary shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
               <FileText size={48} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight mb-2">Download Official Statement</h2>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Generate a branded PDF containing current stock levels, low-stock alerts, 
                and all recent transaction logs for the training camp.
              </p>
              <button 
                onClick={generatePDF}
                disabled={reportStatus === 'generating'}
                className="btn-primary py-4 px-8 text-sm font-bold tracking-widest flex items-center justify-center gap-3 w-full md:w-auto"
              >
                {reportStatus === 'generating' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    GENERATE BRANDED PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {reportStatus === 'success' && (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-success/5 border border-success/20 rounded-system p-6 flex items-center gap-6">
            <div className="w-12 h-12 bg-success/20 text-success rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-success font-bold uppercase tracking-widest text-xs mb-1">Success</p>
              <p className="text-slate-700 text-sm">Your official statement has been generated and downloaded.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
