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

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Daily Report */}
        <div className="system-card p-8 group hover:border-primary transition-all cursor-pointer bg-white" onClick={() => setIsReportModalOpen(true)}>
            <div className="w-[56px] h-[56px] rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110">
                <Calendar size={28} />
            </div>
            <h3 className="text-slate-900 mb-2 font-bold uppercase tracking-tight">Daily Breakdown</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Extract and view today's specific stock movements and logs.</p>
            <button className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                GENERATE <ArrowRight size={14} />
            </button>
        </div>

        {/* Monthly Statement */}
        <div className="system-card p-8 group hover:border-primary transition-all cursor-pointer bg-white" onClick={() => setIsReportModalOpen(true)}>
            <div className="w-[56px] h-[56px] rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110">
                <FileText size={28} />
            </div>
            <h3 className="text-slate-900 mb-2 font-bold uppercase tracking-tight">Stock Statement</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Official monthly report formatted with Swiss Side branding.</p>
            <button className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                GENERATE PDF <ArrowRight size={14} />
            </button>
        </div>

        {/* Custom Range */}
        <div className="system-card p-8 group hover:border-primary transition-all cursor-pointer bg-white" onClick={() => setIsReportModalOpen(true)}>
            <div className="w-[56px] h-[56px] rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110">
                <Settings2 size={28} />
            </div>
            <h3 className="text-slate-900 mb-2 font-bold uppercase tracking-tight">Audit Archive</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Specify exact start and end dates for a bespoke audit statement.</p>
            <button className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                CONFIGURE <ArrowRight size={14} />
            </button>
        </div>
      </div>

      {/* Recent Reports Table */}
      <div className="system-card">
        <div className="px-6 py-5 border-b-2 border-slate-100 bg-slate-50/50">
          <h4 className="text-xs-label font-bold text-slate-500 uppercase tracking-widest">Recent Activity logs</h4>
        </div>
        <div className="divide-y divide-slate-100">
            <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <FileText size={24} />
                </div>
                <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">No statements generated for this period</p>
                <p className="text-slate-400 text-xs mt-1">Activity logs will appear here as you log transactions.</p>
            </div>
        </div>
      </div>

      {/* Generate Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => { setIsReportModalOpen(false); setReportStatus('idle'); }}
        title="Generate System Report"
        footer={reportStatus === 'success' ? (
            <button onClick={() => setIsReportModalOpen(false)} className="btn-secondary w-full">Close Terminal</button>
        ) : (
            <>
                <button onClick={() => setIsReportModalOpen(false)} className="btn-secondary">Cancel</button>
                <button 
                  onClick={generatePDF} 
                  disabled={reportStatus === 'generating'} 
                  className="btn-primary"
                >
                    {reportStatus === 'generating' ? 'Processing...' : 'Generate Statement'}
                </button>
            </>
        )}
      >
        {reportStatus === 'success' ? (
            <div className="text-center py-8">
                <CheckCircle2 size={64} className="text-success mx-auto mb-4" />
                <h3 className="text-slate-900 mb-2 uppercase font-bold tracking-tight">Report Ready</h3>
                <p className="text-sm text-slate-500 mb-6">Statement has been generated and downloaded to your device storage.</p>
                <div className="bg-slate-50 p-4 border rounded-system flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="text-danger" />
                        <span className="text-sm font-bold text-slate-800">Swiss_Side_Report_2026.pdf</span>
                    </div>
                    <Download size={20} className="text-slate-400" />
                </div>
            </div>
        ) : (
            <div className="space-y-6">
                <div>
                    <label className="block text-xs-label text-slate-500 uppercase mb-3">Report Configuration</label>
                    <div className="space-y-2">
                        {['Daily Report', 'Weekly Report', 'Monthly Report', 'Custom Range'].map(t => (
                            <label key={t} className="flex items-center p-3 border rounded-input cursor-pointer hover:bg-slate-50 transition-colors">
                                <input type="radio" name="reportType" className="text-primary focus:ring-primary h-4 w-4" defaultChecked={t === 'Monthly Report'} />
                                <span className="ml-3 text-sm font-bold text-slate-700 uppercase tracking-tight">{t}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs-label text-slate-500 uppercase mb-2">Period Selection</label>
                    <div className="input-field flex items-center px-4 pointer-events-none bg-slate-50/50">
                        <span className="text-sm font-bold text-slate-700">APRIL 2026</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs-label text-slate-500 uppercase mb-3 text-center">Include in Statement</label>
                    <div className="grid grid-cols-2 gap-3">
                        {['Summary Page', 'Transaction Logs', 'Daily Breakdown', 'Staff Performance'].map(c => (
                            <label key={c} className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
                                <input type="checkbox" defaultChecked className="text-primary rounded-sm h-4 w-4" />
                                {c}
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </Modal>

    </div>
  );
}
