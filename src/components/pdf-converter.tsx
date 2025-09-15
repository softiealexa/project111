
"use client";

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, File, LoaderCircle, Download, X, Settings2 } from 'lucide-react';
import { Slider } from './ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export default function PdfConverter() {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null);

    const [contrast, setContrast] = useState(20);
    const [brightness, setBrightness] = useState(1.0);
    const [sharpness, setSharpness] = useState(1.0);
    
    const dropzoneRef = useRef<HTMLDivElement>(null);

    const handleFileChange = (files: FileList | null) => {
        if (files && files[0]) {
            if (files[0].type !== 'application/pdf') {
                toast({
                    title: "Invalid File Type",
                    description: "Please upload a PDF file.",
                    variant: "destructive",
                });
                return;
            }
            setFile(files[0]);
            setConvertedFileUrl(null);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files);
        }
    }, []);

    const handleConvert = async () => {
        if (!file) {
            toast({ title: "No File Selected", description: "Please upload a PDF file to convert.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setConvertedFileUrl(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('contrast', String(contrast));
        formData.append('brightness', String(brightness));
        formData.append('sharpness', String(sharpness));
        
        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred during conversion.' }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            setConvertedFileUrl(url);
            toast({ title: "Conversion Successful", description: "Your PDF is ready for download." });

        } catch (error: any) {
            toast({
                title: "Conversion Failed",
                description: error.message || "Could not connect to the conversion service.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setConvertedFileUrl(null);
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>PDF Background Converter</CardTitle>
                <CardDescription>
                  Upload a PDF with a dark background to convert it to a standard white background, making it easier to read and print.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!file ? (
                    <div
                        ref={dropzoneRef}
                        className="relative flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <UploadCloud className="w-12 h-12 text-muted-foreground" />
                        <p className="mt-4 text-lg text-center text-muted-foreground">
                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-sm text-muted-foreground">PDF files only</p>
                        <Input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileChange(e.target.files)}
                            accept="application/pdf"
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-between w-full p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                            <File className="w-8 h-8 text-primary" />
                            <div>
                                <p className="font-semibold truncate max-w-xs">{file.name}</p>
                                <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={clearFile}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                )}
                
                <Accordion type="single" collapsible>
                    <AccordionItem value="settings">
                        <AccordionTrigger className="text-sm">
                            <div className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5" />
                                Conversion Settings
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-6">
                             <div className="grid gap-2">
                                <Label htmlFor="contrast-slider">Contrast ({contrast})</Label>
                                <Slider id="contrast-slider" value={[contrast]} onValueChange={(v) => setContrast(v[0])} min={-100} max={100} step={1} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="brightness-slider">Brightness ({brightness.toFixed(1)})</Label>
                                <Slider id="brightness-slider" value={[brightness]} onValueChange={(v) => setBrightness(v[0])} min={0} max={2} step={0.1} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="sharpness-slider">Sharpness ({sharpness.toFixed(1)})</Label>
                                <Slider id="sharpness-slider" value={[sharpness]} onValueChange={(v) => setSharpness(v[0])} min={0} max={2} step={0.1} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {convertedFileUrl ? (
                    <div className="flex flex-col sm:flex-row gap-4">
                        <a href={convertedFileUrl} download={`${file?.name.replace('.pdf', '') || 'converted'}_white.pdf`} className="flex-1">
                            <Button className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Download Converted PDF
                            </Button>
                        </a>
                        <Button variant="outline" onClick={handleConvert} disabled={isLoading}>
                             {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Convert Again
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleConvert} disabled={!file || isLoading} className="w-full">
                        {isLoading ? (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <UploadCloud className="mr-2 h-4 w-4" />
                        )}
                        {isLoading ? 'Converting...' : 'Convert PDF'}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
