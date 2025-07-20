import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { databases } from "../../../utils/appwrite";
import { getCurrentStudentSession } from "../../../utils/auth";
import { formatDateTimeUTC } from "../../../utils/date";
import { BookOpen, AlertTriangle, CheckSquare, Palette, MousePointerClick, Clock, Info, Shield, ArrowRight, Flag, Check } from "lucide-react";

const EXAMS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

// Helper component for individual instruction points
const InstructionItem = ({ icon, title, text }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 mt-1 text-indigo-500 bg-indigo-100 p-2 rounded-full">{icon}</div>
    <div>
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <p className="text-gray-600 text-sm">{text}</p>
    </div>
  </div>
);

// Helper component for the palette guide
const PaletteGuide = ({ color, text }) => (
    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
        <div className={`w-8 h-8 rounded-md ${color} flex items-center justify-center text-white font-bold text-sm shadow-inner`}>Q</div>
        <span className="text-sm text-gray-700">{text}</span>
    </div>
);


const ExamInstructionsPage = () => {
  const router = useRouter();
  const { id: examId } = router.query;
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [instructionsRead, setInstructionsRead] = useState(false);

  useEffect(() => {
    const studentSession = getCurrentStudentSession();
    if (!studentSession) {
      router.replace("/login");
      return;
    }
    if (!examId) return;

    databases.getDocument(DATABASE_ID, EXAMS_COLLECTION, examId)
      .then((doc) => {
        setExam(doc);
      })
      .catch((err) => {
          console.error("Failed to fetch exam details:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [examId, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Exam Details...</div>;
  }
  if (!exam) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Error: Exam not found or could not be loaded.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        
        <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{exam.name}</h1>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">{exam.description}</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Instructions */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                    <Info size={24} className="text-indigo-600"/>
                    Important Instructions
                </h2>

                <div className="space-y-6">
                    <InstructionItem icon={<Clock size={20}/>} title="Timer" text={`The exam has a duration of ${exam.duration} minutes. The countdown timer in the top right corner will display the remaining time. The exam will submit automatically when the time runs out.`} />
                    <InstructionItem icon={<CheckSquare size={20}/>} title="Answering Questions" text="To answer a question, click the radio button next to your chosen option. Your answer is saved immediately. To change your answer, simply select another option." />
                    <InstructionItem icon={<ArrowRight size={20}/>} title="Navigating Questions" text="Use the 'Next' and 'Previous' buttons to move between questions. You can also jump to any question by clicking its number in the Question Palette." />
                    <InstructionItem icon={<Flag size={20}/>} title="Mark for Review" text="If you are unsure about an answer, you can use the 'Mark for Review' button. This will highlight the question in the palette, reminding you to return to it later. This does not affect your final score." />
                    <InstructionItem icon={<Check size={20}/>} title="Submitting the Exam" text="Click the 'Submit Exam' button to finish the test. You will be asked to confirm before your exam is submitted permanently. You cannot make changes after submission." />
                    <InstructionItem icon={<AlertTriangle size={20}/>} title="Do Not Refresh" text="Avoid refreshing the page or using the browser's back/forward buttons, as this may disrupt your exam session and cause loss of progress." />
                    <InstructionItem icon={<Shield size={20}/>} title="Academic Integrity" text="This is a proctored exam. Any form of malpractice, such as opening new tabs or trying to copy/paste, will be logged and may result in disqualification." />
                </div>
            </div>

            {/* Right Column: Palette and Declaration */}
            <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
                        <Palette size={20} className="text-indigo-600"/>
                        Question Palette Guide
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        <PaletteGuide color="bg-gray-400" text="You have not visited the question yet." />
                        <PaletteGuide color="bg-green-500" text="You have answered the question." />
                        <PaletteGuide color="bg-yellow-500" text="You have marked the question for review." />
                        <PaletteGuide color="bg-blue-600" text="This is the current question you are viewing." />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                     <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
                        <BookOpen size={20} className="text-indigo-600"/>
                        Declaration
                    </h3>
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={instructionsRead}
                            onChange={() => setInstructionsRead(!instructionsRead)}
                            className="mt-1 h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <p className="text-sm text-gray-800">
                            I have read and understood all the instructions. I agree to abide by the rules of the examination.
                        </p>
                        </label>
                    </div>
                     <button
                        className="w-full mt-6 px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-300 disabled:shadow-none transform hover:-translate-y-1 disabled:transform-none"
                        onClick={() => router.push(`/student/exams/take?examId=${exam.$id}`)}
                        disabled={!instructionsRead}
                    >
                        Start Exam
                    </button>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export default ExamInstructionsPage;
