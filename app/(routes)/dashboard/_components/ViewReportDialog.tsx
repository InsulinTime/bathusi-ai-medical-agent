// this file is app/%28routes%29/dashboard/_components/ViewReportDialog.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { SessionDetail } from "../medical-agent/[sessionid]/page";
import moment from "moment";
import { Printer, Download } from "lucide-react";

type props = {
    record: SessionDetail
}

function ViewReportDialog({ record }: props) {
    const report: any = record?.report;
    const formatDate = moment(record?.createdOn).format("MMMM Do YYYY, h:mm a");

    const chiefComplaint = report?.chiefComplaint || "No chief complaint recorded";
    const summary = report?.summary || "No summary available";
    const symptoms = report?.symptoms || [];
    const duration = report?.duration || "Not specified";
    const severity = report?.severity || "Not assessed";
    const recommendations: string[] = report?.recommendations || [];
    const user = report?.user || "Anonymous";

    const handlePrint = () => {
        const printContent = document.getElementById('printable-report');
        if (printContent) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Bathusi-AI Medical Report</title>
                        <style>
                            body { 
                                font-family: Arial, sans-serif; 
                                line-height: 1.6; 
                                color: #333; 
                                max-width: 800px; 
                                margin: 0 auto; 
                                padding: 20px;
                            }
                            .header { 
                                text-align: center; 
                                border-bottom: 3px solid #2563eb; 
                                padding-bottom: 20px; 
                                margin-bottom: 30px;
                            }
                            .section { 
                                margin-bottom: 25px; 
                                padding: 15px; 
                                border-left: 4px solid #2563eb;
                                background: #f8fafc;
                            }
                            .section-title { 
                                font-weight: bold; 
                                color: #1e40af; 
                                margin-bottom: 10px;
                                font-size: 16px;
                            }
                            .severity-high { background: #fef2f2; color: #dc2626; }
                            .severity-medium { background: #fffbeb; color: #d97706; }
                            .severity-low { background: #f0fdf4; color: #16a34a; }
                            .disclaimer { 
                                background: #fef3c7; 
                                padding: 15px; 
                                border: 1px solid #f59e0b;
                                border-radius: 6px;
                                margin-top: 30px;
                                font-size: 12px;
                            }
                            ul { margin: 10px 0; padding-left: 20px; }
                            li { margin-bottom: 5px; }
                            @media print {
                                body { margin: 0; padding: 15px; }
                                .no-print { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent.innerHTML}
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    const handleDownload = () => {
        const content = `
            BATHUSI-AI MEDICAL CONSULTATION REPORT
            =======================================

            Patient: ${user}
            Consultation Date: ${formatDate}
            Bathusi Specialist: ${record.selectedBathusi?.specialist}
            Session ID: ${record.sessionId}

            CHIEF COMPLAINT:
            ${chiefComplaint}

            SEVERITY ASSESSMENT: ${severity.toUpperCase()}
            SYMPTOM DURATION: ${duration}

            CONSULTATION SUMMARY:
            ${summary}

            REPORTED SYMPTOMS:
            ${symptoms.length > 0 ? symptoms.map((symptom: string) => `• ${symptom}`).join('\n') : 'No specific symptoms recorded'}

            AI RECOMMENDATIONS:
            ${recommendations.length > 0 ? recommendations.map(rec => `• ${rec}`).join('\n') : 'No specific recommendations provided'}

            IMPORTANT DISCLAIMER:
            This report is generated by an AI assistant and is for informational purposes only. 
            It does not constitute medical advice, diagnosis, or treatment. Always consult with 
            a qualified healthcare professional for medical concerns.

            Generated by Bathusi-AI Assistant on ${new Date().toLocaleDateString()}
            `.trim();

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bathusi-report-${record.sessionId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant={'link'} size={'sm'}>View Report</Button>
            </DialogTrigger>
            <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-lg p-6'>
                <DialogHeader className="no-print">
                    <DialogTitle className="text-center text-2xl font-bold text-blue-600">
                        Medical Consultation Report
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-600">
                        Generated by Bathusi-AI Assistant
                    </DialogDescription>
                    
                    <div className="flex gap-2 justify-center mt-4 no-print">
                        <Button onClick={handlePrint} className="gap-2">
                            <Printer className="w-4 h-4" />
                            Print Report
                        </Button>
                        <Button onClick={handleDownload} variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Download
                        </Button>
                    </div>
                </DialogHeader>

                <div id="printable-report" className="space-y-6">
                    <div className="section">
                        <div className="section-title">Patient & Session Information</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p><strong>Patient Name:</strong> {user}</p>
                                <p><strong>Consultation Date:</strong> {formatDate}</p>
                            </div>
                            <div>
                                <p><strong>Bathusi Specialist:</strong> {record.selectedBathusi?.specialist}</p>
                                <p><strong>Session ID:</strong> {record.sessionId}</p>
                            </div>
                        </div>
                    </div>

                    <div className="section">
                        <div className="section-title">Chief Complaint</div>
                        <p>{chiefComplaint}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="section">
                            <div className="section-title">Severity Assessment</div>
                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                severity === 'severe' ? 'severity-high' :
                                severity === 'moderate' ? 'severity-medium' :
                                'severity-low'
                            }`}>
                                {severity.toUpperCase()}
                            </div>
                        </div>
                        <div className="section">
                            <div className="section-title">Symptom Duration</div>
                            <p>{duration}</p>
                        </div>
                    </div>

                    <div className="section">
                        <div className="section-title">Consultation Summary</div>
                        <p className="leading-relaxed">{summary}</p>
                    </div>

                    <div className="section">
                        <div className="section-title">Reported Symptoms</div>
                        {symptoms.length > 0 ? (
                            <ul>
                                {symptoms.map((symptom: string, index: number) => (
                                    <li key={index}>{symptom}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="italic">No specific symptoms recorded</p>
                        )}
                    </div>

                    <div className="section">
                        <div className="section-title">AI Recommendations</div>
                        {recommendations.length > 0 ? (
                            <ul>
                                {recommendations.map((recommendation: string, index: number) => (
                                    <li key={index}>{recommendation}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="italic">No specific recommendations provided</p>
                        )}
                    </div>

                    {/* Medical Disclaimer */}
                    <div className="disclaimer">
                        <div className="section-title">Important Disclaimer</div>
                        <p className="text-sm">
                            This report is generated by an AI assistant and is for informational purposes only. 
                            It does not constitute medical advice, diagnosis, or treatment. Always consult with 
                            a qualified healthcare professional for medical concerns.
                        </p>
                    </div>
                </div>

                {/* Print buttons at bottom for easy access */}
                <div className="flex gap-2 justify-center mt-6 no-print">
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="w-4 h-4" />
                        Print Report
                    </Button>
                    <Button onClick={handleDownload} variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Download as Text
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ViewReportDialog