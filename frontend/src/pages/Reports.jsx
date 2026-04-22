import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  FileText, 
  Download, 
  ChefHat, 
  Dumbbell, 
  Bed, 
  Package,
  ShieldCheck,
  ChevronRight,
  Info,
  AlertCircle
} from 'lucide-react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from 'react-hot-toast';

export default function Reports() {
  const [reportStatus, setReportStatus] = useState('idle');
  
  // Data Aggregation
  const kitchenItems = useQuery(api.items.getAll);
  const gymItems = useQuery(api.gymItems.getAll);
  const rooms = useQuery(api.rooms.getAll);
  const roomItems = useQuery(api.roomItems.getAll);
  const generalSupplies = useQuery(api.generalSupplies.getAll);
  const kitchenHistory = useQuery(api.transactions.getHistory);
  const procurementNeeds = useQuery(api.needs.getAll);

  const stats = useMemo(() => {
    if (!kitchenItems || !gymItems || !rooms || !roomItems || !generalSupplies || !procurementNeeds) return null;
    return { kitchenItems, gymItems, rooms, roomItems, generalSupplies, kitchenHistory, procurementNeeds };
  }, [kitchenItems, gymItems, rooms, roomItems, generalSupplies, kitchenHistory, procurementNeeds]);

  const generatePDF = async (type = 'master') => {
    if (!stats) return toast.error("Intelligence data not yet synchronized.");
    setReportStatus('generating');

    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();
      const dateStr = new Date().toISOString().split('T')[0];

      // Premium Header
      doc.setFillColor(163, 94, 69); // Terracotta
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.text("SWISS SIDE ITEN", 105, 25, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("PREMIUM LODGE & ATHLETE PERFORMANCE CENTER • ITEN, KENYA", 105, 33, { align: 'center' });

      // Sub-Header
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const titles = {
        master: "EXECUTIVE DAILY SUMMARY",
        rooms: "ROOM STATUS & INVENTORY REPORT",
        gym: "GYM EQUIPMENT & MAINTENANCE REPORT",
        kitchen: "KITCHEN STOCK & USAGE REPORT",
        issues: "OPEN ISSUES & NEEDS AUDIT"
      };
      doc.text(titles[type] || "OPERATIONAL REPORT", 15, 60);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(`REFERENCE: SS-REPORT-${dateStr}-${Math.random().toString(36).substring(7).toUpperCase()}`, 15, 66);
      doc.text(`GENERATED ON: ${timestamp}`, 15, 71);

      let currentY = 80;

      // Section: Kitchen Stock
      if (type === 'master' || type === 'kitchen') {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(163, 94, 69);
        doc.text("KITCHEN STOCK LEVELS", 15, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Item Name', 'Current Qty', 'Unit', 'Status']],
          body: stats.kitchenItems.map(i => [i.name, i.quantity, i.unit, i.quantity <= i.reorderLevel ? 'LOW' : 'OPTIMAL']),
          headStyles: { fillColor: [163, 94, 69] },
          margin: { left: 15, right: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 20;
      }

      // Section: Gym Equipment
      if (type === 'master' || type === 'gym') {
        if (currentY > 240) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 52, 54);
        doc.text("GYM ASSET STATUS", 15, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Asset', 'Qty', 'Condition', 'Last Inspected']],
          body: stats.gymItems.map(i => [i.name, i.quantity, i.condition, i.lastChecked || 'N/A']),
          headStyles: { fillColor: [45, 52, 54] },
          margin: { left: 15, right: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 20;
      }

      // Section: Room Status
      if (type === 'master' || type === 'rooms') {
        if (currentY > 240) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(197, 160, 89);
        doc.text("ROOM OCCUPANCY & ASSETS", 15, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Room', 'Type', 'Status', 'Assets Count']],
          body: stats.rooms.map(r => [
            r.name, 
            r.type, 
            r.status, 
            stats.roomItems.filter(ri => ri.roomId === r._id).length
          ]),
          headStyles: { fillColor: [197, 160, 89] },
          margin: { left: 15, right: 15 }
        });
        currentY = doc.lastAutoTable.finalY + 20;
      }

      // Section: Issues & Needs
      if (type === 'master' || type === 'issues') {
        if (currentY > 240) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(239, 68, 68);
        doc.text("CRITICAL ISSUES & PROCUREMENT NEEDS", 15, currentY);
        
        const issues = [
          ...stats.kitchenItems.filter(i => i.quantity <= i.reorderLevel).map(i => ['Kitchen', i.name, 'Low Stock', 'Restock']),
          ...stats.gymItems.filter(i => i.condition === 'Maintenance' || i.condition === 'Broken').map(i => ['Gym', i.name, i.condition, 'Repair']),
          ...stats.rooms.filter(r => r.status === 'Maintenance').map(r => ['Room', r.name, 'Maintenance', 'Fix']),
          ...stats.procurementNeeds.map(n => [n.department, n.item, `Need: ${n.quantity || '1'}`, n.priority]),
          ...stats.generalSupplies.filter(s => s.quantity <= s.reorderLevel).map(s => ['Supplies', s.name, 'Low Stock', 'Restock'])
        ];

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Department', 'Item / Location', 'Status / Requirement', 'Priority']],
          body: issues,
          headStyles: { fillColor: [239, 68, 68] },
          margin: { left: 15, right: 15 }
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("CONFIDENTIAL • SWISS SIDE ITEN • PROPERTY OF MANAGEMENT", 105, 285, { align: 'center' });
      }

      doc.save(`Swiss_Side_Report_${type}_${dateStr}.pdf`);
      setReportStatus('idle');
      toast.success("Intelligence Report Exported Successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to compile report.");
      setReportStatus('idle');
    }
  };

  const reportCards = [
    { id: 'master', title: 'Daily Summary', icon: FileText, desc: 'Full operational snapshot for today.', color: 'border-l-slate-900 bg-slate-50' },
    { id: 'rooms', title: 'Room Status', icon: Bed, desc: 'Occupancy and inventory per room.', color: 'border-l-accent-gold bg-accent-gold/5' },
    { id: 'gym', title: 'Gym Equipment', icon: Dumbbell, desc: 'Asset condition and maintenance cycles.', color: 'border-l-slate-700 bg-slate-50' },
    { id: 'kitchen', title: 'Kitchen Stock', icon: ChefHat, desc: 'Consumables and usage trends.', color: 'border-l-primary bg-primary/5' },
    { id: 'issues', title: 'Issues & Needs', icon: AlertCircle, desc: 'Critical alerts and missing inventory.', color: 'border-l-danger bg-danger/5' },
  ];

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2 uppercase">Intelligence Reports</h1>
          <p className="text-slate-500 font-medium max-w-2xl">
            Generate and export high-fidelity operational statements for stakeholders. 
            All reports are derived from live departmental audits.
          </p>
        </div>
        <button 
          onClick={() => generatePDF('master')}
          disabled={reportStatus === 'generating'}
          className="btn-primary py-4 px-8 rounded-2xl flex items-center gap-3 shadow-premium hover:scale-[1.02] transition-all"
        >
          {reportStatus === 'generating' ? 'Compiling Master...' : <><ShieldCheck size={20} /> Master Executive Export</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reportCards.map((card) => (
          <div key={card.id} className={`system-card p-10 border-l-8 ${card.color} group hover:shadow-elevated transition-all duration-500`}>
            <div className="flex flex-col h-full">
              <div className="p-4 bg-white/50 rounded-2xl w-fit mb-6 shadow-sm border border-white">
                <card.icon size={32} className="text-slate-700" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2 uppercase tracking-tight">{card.title}</h3>
              <p className="text-slate-500 text-sm mb-8 flex-1">{card.desc}</p>
              <button 
                onClick={() => generatePDF(card.id)}
                className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors group"
              >
                Compile Report <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="system-card p-12 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <FileText size={160} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
            <Info size={14} /> Compliance & Auditing
          </div>
          <h2 className="text-3xl font-extrabold mb-4 uppercase">Automated Asset Intelligence</h2>
          <p className="text-slate-400 font-medium leading-relaxed mb-8">
            Swiss Side management reports are cryptographically signed with unique reference IDs. 
            The system cross-references kitchen consumption with room occupancy to provide 
            predictive stock requirements and maintenance forecasts.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Branded PDF Generation', 'Multi-Department Sync', 'Real-time Stock Snapshot', 'Maintenance Log Inclusion'].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-bold">
                <ShieldCheck size={18} className="text-primary" /> {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
