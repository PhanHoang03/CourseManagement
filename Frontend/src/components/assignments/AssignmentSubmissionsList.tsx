"use client"

import { useState, useEffect } from "react";
import { assignmentsApi } from "@/lib/api";
import Image from "next/image";

interface AssignmentSubmissionsListProps {
  assignmentId: string;
  maxScore: number;
  onGraded?: () => void;
}

const AssignmentSubmissionsList = ({ assignmentId, maxScore, onGraded }: AssignmentSubmissionsListProps) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [grading, setGrading] = useState<string | null>(null);
  const [score, setScore] = useState<{ [key: string]: number }>({});
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await assignmentsApi.getAllSubmissions({ assignmentId });
      if (response.success && response.data) {
        setSubmissions(response.data);
        // Initialize score and feedback from existing grades
        const initialScore: { [key: string]: number } = {};
        const initialFeedback: { [key: string]: string } = {};
        response.data.forEach((sub: any) => {
          if (sub.score !== null) initialScore[sub.id] = sub.score;
          if (sub.feedback) initialFeedback[sub.id] = sub.feedback;
        });
        setScore(initialScore);
        setFeedback(initialFeedback);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (submissionId: string) => {
    const submissionScore = score[submissionId];
    if (submissionScore === undefined || submissionScore < 0 || submissionScore > maxScore) {
      alert(`Please enter a valid score between 0 and ${maxScore}`);
      return;
    }

    try {
      setGrading(submissionId);
      const response = await assignmentsApi.grade(submissionId, {
        score: submissionScore,
        feedback: feedback[submissionId] || '',
        status: 'graded',
      });

      if (response.success) {
        await fetchSubmissions();
        if (onGraded) onGraded();
        setExpandedSubmission(null);
      } else {
        alert(response.error || "Failed to grade assignment");
      }
    } catch (error: any) {
      alert(error.message || "Failed to grade assignment");
    } finally {
      setGrading(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading submissions...</div>;
  }

  if (submissions.length === 0) {
    return <div className="text-sm text-gray-500">No submissions yet</div>;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Submissions ({submissions.length})</h4>
      {submissions.map((submission: any) => {
        const isExpanded = expandedSubmission === submission.id;
        const isGraded = submission.status === 'graded';
        const submissionScore = score[submission.id] ?? submission.score ?? '';
        const submissionFeedback = feedback[submission.id] ?? submission.feedback ?? '';

        return (
          <div key={submission.id} className="bg-white rounded-md border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {submission.trainee?.firstName} {submission.trainee?.lastName}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({submission.trainee?.email})
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isGraded
                      ? 'bg-green-100 text-green-800'
                      : submission.status === 'submitted'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isGraded ? 'Graded' : submission.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Submitted: {new Date(submission.submittedAt).toLocaleString()}
                </p>
                {isGraded && submission.score !== null && (
                  <p className="text-xs text-green-600 mt-1">
                    Score: {submission.score} / {maxScore}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isGraded && (
                  <button
                    onClick={() => setExpandedSubmission(isExpanded ? null : submission.id)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {isExpanded ? 'Hide' : 'Grade'}
                  </button>
                )}
                {isGraded && (
                  <button
                    onClick={() => setExpandedSubmission(isExpanded ? null : submission.id)}
                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    {isExpanded ? 'Hide' : 'View'}
                  </button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t space-y-3">
                {/* Submission Content */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Submission:</label>
                  <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap min-h-[100px]">
                    {submission.submissionText || '(No text submission)'}
                  </div>
                  {submission.submissionFiles && submission.submissionFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Files:</p>
                      <div className="space-y-1">
                        {submission.submissionFiles.map((file: string, idx: number) => (
                          <div key={idx} className="text-xs text-blue-600">📎 {file}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Grading Form */}
                {!isGraded && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">
                        Score (0 - {maxScore}):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={maxScore}
                        value={submissionScore}
                        onChange={(e) => setScore({ ...score, [submission.id]: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter score"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Feedback:</label>
                      <textarea
                        value={submissionFeedback}
                        onChange={(e) => setFeedback({ ...feedback, [submission.id]: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter feedback for the student..."
                      />
                    </div>
                    <button
                      onClick={() => handleGrade(submission.id)}
                      disabled={grading === submission.id || submissionScore === ''}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {grading === submission.id ? 'Grading...' : 'Submit Grade'}
                    </button>
                  </div>
                )}

                {/* View Grade (if already graded) */}
                {isGraded && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Score:</label>
                      <div className="text-sm font-semibold text-green-600">
                        {submission.score} / {maxScore}
                      </div>
                    </div>
                    {submission.feedback && (
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Feedback:</label>
                        <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">
                          {submission.feedback}
                        </div>
                      </div>
                    )}
                    {submission.gradedAt && (
                      <p className="text-xs text-gray-500">
                        Graded: {new Date(submission.gradedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AssignmentSubmissionsList;
