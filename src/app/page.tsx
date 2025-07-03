import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { subjects } from "@/lib/data"
import LectureTracker from "@/components/lecture-tracker";
import { BookOpenCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background text-foreground">
      <header className="w-full max-w-5xl px-4 py-8 md:py-12">
        <div className="flex items-center gap-4">
          <BookOpenCheck className="h-10 w-10 text-primary" />
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary-foreground">
            Trackademic
          </h1>
        </div>
        <p className="mt-2 text-lg text-muted-foreground">
          Your daily guide to mastering concepts, one lecture at a time.
        </p>
      </header>
      <main className="w-full max-w-5xl flex-1 px-4 pb-12">
        <Tabs defaultValue={subjects[0].name} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            {subjects.map((subject) => (
              <TabsTrigger key={subject.name} value={subject.name} className="flex items-center gap-2">
                <subject.icon className="h-5 w-5" />
                <span>{subject.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {subjects.map((subject) => (
            <TabsContent key={subject.name} value={subject.name} className="mt-6">
              <LectureTracker subject={subject} />
            </TabsContent>
          ))}
        </Tabs>
      </main>
      <footer className="w-full max-w-5xl px-4 py-6 text-center text-sm text-muted-foreground">
        <p>Built for focused learners. &copy; {new Date().getFullYear()} Trackademic.</p>
      </footer>
    </div>
  );
}
