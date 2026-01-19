"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { assignmentsApi, enrollmentsApi, coursesApi } from "@/lib/api";

const AssignmentSubmissionPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [courseId, assignmentId, user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch assignment, course, and enrollment
      const [assignmentRes, courseRes, enrollmentsRes] = await Promise.all([
        assignmentsApi.getById(assignmentId),
        coursesApi.getById(courseId),
        enrollmentsApi.getAll({ courseId, traineeId: user.id }),
      ]);

      if (!assignmentRes.success || !assignmentRes.data) {
        setError("Assignment not found");
        return;
      }

      if (!courseRes.success || !courseRes.data) {
        setError("Course not found");
        return;
      }

      setAssignment(assignmentRes.data);
      setCourse(courseRes.data);

      if (enrollmentsRes.success && enrollmentsRes.data && enrollmentsRes.data.length > 0) {
        const userEnrollment = enrollmentsRes.data[0];
        setEnrollment(userEnrollment);

        // Fetch existing submission
        try {
          const submissionsRes = await assignmentsApi.getAllSubmissions({
            assignmentId,
            enrollmentId: userEnrollment.id,
          });

          if (submissionsRes.success && submissionsRes.data && submissionsRes.data.length > 0) {
            const existingSubmission = submissionsRes.data[0];
            setSubmission(existingSubmission);
            setSubmissionText(existingSubmission.submissionText || "");
          }
        } catch (error) {
          console.error("Failed to fetch submission:", error);
        }
      } else {
        setError("You are not enrolled in this course");
      }
    } catch (error: any) {
      setError(error.message || "Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!enrollment || !submissionText.trim()) {
      alert("Please provide your submission");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await assignmentsApi.submit({
        assignmentId,
        enrollmentId: enrollment.id,
        submissionText: submissionText.trim(),
        submissionFiles: [], // File upload can be added later
      });

      if (response.success) {
        alert("Assignment submitted successfully!");
        fetchData(); // Refresh to show updated submission
      } else {
        setError(response.error || "Failed to submit assignment");
      }
    } catch (error: any) {
      setError(error.message || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 m-4 mt-0 flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="flex-1 m-4 mt-0 flex flex-col items-center justify-center min-h-[600px]">
        <p className="text-red-600 mb-4">{error}</p>
        <Link
          href={`/courses/${courseId}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Course
        </Link>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="flex-1 m-4 mt-0 flex flex-col items-center justify-center min-h-[600px]">
        <p className="text-gray-600 mb-4">You are not enrolled in this course</p>
        <Link
          href={`/courses/${courseId}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Course
        </Link>
      </div>
    );
  }

  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date() && !submission;
  const canSubmit = !submission || submission.status === 'returned';
  const isGraded = submission?.status === 'graded';

  return (
    <div className="flex-1 m-4 mt-0 flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white rounded-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href={`/courses/${courseId}`}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                ← Back to Course
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {course?.title} • {course?.courseCode}
            </p>
          </div>
          {isOverdue && (
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              Overdue
            </span>
          )}
          {isGraded && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Graded
            </span>
          )}
          {submission && submission.status === 'submitted' && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Submitted
            </span>
          )}
        </div>

        {/* Assignment Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
          {assignment.dueDate && (
            <div>
              <p className="text-xs text-gray-500">Due Date</p>
              <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {new Date(assignment.dueDate).toLocaleString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500">Max Score</p>
            <p className="text-sm font-medium text-gray-900">{assignment.maxScore} points</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-sm font-medium text-gray-900">
              {assignment.isRequired ? "Required" : "Optional"}
            </p>
          </div>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="bg-white rounded-md p-6">
        {assignment.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
          </div>
        )}

        {assignment.instructions && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Instructions</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{assignment.instructions}</p>
            </div>
          </div>
        )}
      </div>

      {/* Submission Section */}
      <div className="bg-white rounded-md p-6">
        <h2 className="text-lg font-semibold mb-4">
          {submission ? "Your Submission" : "Submit Assignment"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {isGraded && submission && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-green-800">Graded</h3>
              <span className="text-lg font-bold text-green-600">
                {submission.score} / {assignment.maxScore}
              </span>
            </div>
            {submission.feedback && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Feedback:</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
              </div>
            )}
          </div>
        )}

        {submission && submission.status === 'submitted' && !isGraded && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Your submission has been received and is awaiting grading.
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Submitted: {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Submission Text {submission && !canSubmit && "(Cannot edit - already submitted)"}
          </label>
          <textarea
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            disabled={!canSubmit}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter your submission here..."
          />
        </div>

        {canSubmit && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting || !submissionText.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : submission ? "Update Submission" : "Submit Assignment"}
            </button>
            {submission && (
              <p className="text-sm text-gray-500">
                You can update your submission until it's graded.
              </p>
            )}
          </div>
        )}

        {submission && submission.submissionFiles && submission.submissionFiles.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">Attached Files:</p>
            <div className="space-y-2">
              {submission.submissionFiles.map((file: string, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📎</span>
                  <span>{file}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentSubmissionPage;
