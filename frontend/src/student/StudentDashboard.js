import React, { useEffect, useState } from "react";
import { IoCheckmarkCircle, IoInformationCircle, IoBook, IoAlertCircle, IoAddCircle, IoWarning } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/Modal";
import { useToast } from "../components/ui/Toast";

function StudentDashboard() {
    const [student] = useState(JSON.parse(localStorage.getItem("user")) || {});
    const [courses, setCourses] = useState([]);
    const [registeredCourses, setRegisteredCourses] = useState([]);
    const [requests, setRequests] = useState([]);
    const [specializationType, setSpecializationType] = useState('none'); // 'none', 'minor', 'honor'

    // Modal States
    const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
    const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
    const [requestForm, setRequestForm] = useState({ course_name: '', details: '', course_type: 'Add-On', credits: '' });

    const { addToast } = useToast();
    const navigate = useNavigate();

    // Derived Lists
    const regularCourses = courses.filter(c => c.type === 'Regular' && c.dept_id === student.dept_id);
    const electiveCourses = courses.filter(c => c.type === 'Elective' && c.dept_id === student.dept_id);

    // Filter Specialization based on selection


    // Limits and Totals
    const [creditLimit, setCreditLimit] = useState(25);
    const [usedCredits, setUsedCredits] = useState(0);

    useEffect(() => {
        if (!student.id) return;
        Promise.all([
            fetch(`http://localhost:5000/courses?semester=${student.semester}`).then(r => r.json()),
            fetch(`http://localhost:5000/registrations/${student.id}`).then(r => r.json()),
            fetch(`http://localhost:5000/requests/${student.id}`).then(r => r.json()),
            fetch("http://localhost:5000/semester-limits").then(r => r.json())
        ]).then(([coursesData, regData, requestsData, limitsData]) => {
            setCourses(Array.isArray(coursesData) ? coursesData : []);
            const regs = Array.isArray(regData) ? regData : [];
            setRegisteredCourses(regs);
            setRequests(Array.isArray(requestsData) ? requestsData : []);

            // Set initial specialization selection based on existing registrations
            const hasMinor = regs.some(c => c.type === 'Minor');
            const hasHonor = regs.some(c => c.type === 'Honors');
            if (hasMinor) setSpecializationType('minor');
            else if (hasHonor) setSpecializationType('honor');

            const limitObj = (Array.isArray(limitsData) ? limitsData : []).find(l => l.semester === student.semester);
            if (limitObj) setCreditLimit(limitObj.credit_limit);
        });
    }, [student]);

    // Recalculate Credits - STRICTLY Regular + Elective ONLY
    useEffect(() => {
        const regularSum = regularCourses.reduce((sum, c) => sum + parseInt(c.credits || 0), 0);
        const electiveSum = registeredCourses
            .filter(c => c.type === 'Elective')
            .reduce((sum, c) => sum + parseInt(c.credits || 0), 0);

        // Honor, Minor, Add-on, Exception are EXCLUDED
        setUsedCredits(regularSum + electiveSum);
    }, [registeredCourses, regularCourses]);

    const fetchRegisteredCourses = async () => {
        const res = await fetch(`http://localhost:5000/registrations/${student.id}`);
        const data = await res.json();
        setRegisteredCourses(Array.isArray(data) ? data : []);
    };

    const fetchRequests = async () => {
        const res = await fetch(`http://localhost:5000/requests/${student.id}`);
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
    }

    const handleRegister = async (course) => {
        if (!student.id) return;

        // Credit Check only for Electives
        if (course.type === 'Elective') {
            const courseCredits = parseInt(course.credits);
            // Current usedCredits includes Regular + Registered Electives.
            // Check if adding this elective exceeds the total limit.
            // Note: The limit (e.g. 25) usually covers the semester load (Regular + Elective).
            if (usedCredits + courseCredits > creditLimit) {
                addToast(`Credit limit exceeded! Limit: ${creditLimit}, Current: ${usedCredits}, New: ${usedCredits + courseCredits}`, "error");
                return;
            }
        }

        try {
            const res = await fetch("http://localhost:5000/registrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ student_id: student.id, course_id: course.id }),
            });
            const data = await res.json();

            if (res.status === 201) {
                await fetchRegisteredCourses();
                addToast("Course registered successfully!", "success");
            } else {
                addToast(data.message || "Registration failed", "error");
            }
        } catch (error) {
            addToast("Network error", "error");
        }
    };

    const handleRequestSubmit = async (type) => {
        if (!requestForm.course_name) return addToast("Course name is required", "error");

        try {
            const res = await fetch("http://localhost:5000/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: student.id,
                    course_name: requestForm.course_name,
                    request_type: type, // 'addon' or 'exception'
                    details: {
                        description: requestForm.details,
                        course_type: requestForm.course_type,
                        credits: requestForm.credits
                    }
                })
            });

            if (res.ok) {
                addToast("Request submitted successfully", "success");
                setIsAddonModalOpen(false);
                setIsExceptionModalOpen(false);
                setRequestForm({ course_name: '', details: '', course_type: 'Add-On', credits: '' });
                fetchRequests();
            } else {
                addToast("Failed to submit request", "error");
            }
        } catch (err) {
            addToast("Network error", "error");
        }
    };
    const toggleSpecialization = (type) => {
        if (specializationType === type) {
            setSpecializationType('none'); // Toggle off
        } else {
            setSpecializationType(type);
        }
    };

    // Filter Specialization based on selection
    const displayedSpecializationCourses = courses.filter(c => {
        // Enforce Department and Semester Match
        if (c.dept_id !== student.dept_id || c.semester !== student.semester) {
            return false;
        }

        if (specializationType === 'minor') return c.type === 'Minor';
        if (specializationType === 'honor') return c.type === 'Honors';
        return false;
    });

    const creditPercentage = Math.min((usedCredits / creditLimit) * 100, 100);

    return (
        <div>
            {/* Top Actions: Add-On Request */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <Button variant="secondary" onClick={() => setIsAddonModalOpen(true)}>
                    <IoAddCircle size={20} /> Ask for Add-On Course
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3">
                {/* Sidebar Stats */}
                <div style={{ gridColumn: 'span 1' }}>
                    <Card style={{ position: 'sticky', top: '100px' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <IoBook /> Credit Status
                        </h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span>Total Credits (Reg + Elec)</span>
                                <span style={{ fontWeight: 600, color: usedCredits > creditLimit ? 'var(--danger)' : 'var(--primary)' }}>
                                    {usedCredits} / {creditLimit}
                                </span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${creditPercentage}%`,
                                    height: '100%',
                                    background: usedCredits >= creditLimit ? 'var(--danger)' : 'var(--primary)',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                * Honor, Minor, and Add-on courses are not included in credit calculation.
                            </p>
                        </div>

                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Registered Courses</h4>
                        {registeredCourses.length === 0 ? (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No courses registered yet.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', marginBottom: '1.5rem' }}>
                                {registeredCourses.map(c => (
                                    <li key={c.id} style={{
                                        padding: '0.5rem 0',
                                        borderBottom: '1px solid var(--border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.9rem'
                                    }}>
                                        <IoCheckmarkCircle style={{ color: 'var(--success)', flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{c.course_code}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.course_name} <span className="badge badge-gray" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>{c.type}</span></div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>My Add-On / Requests</h4>
                        {requests.length === 0 ? (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No active requests.</p>
                        ) : (
                            <ul style={{ listStyle: 'none' }}>
                                {requests.map(r => (
                                    <li key={r.id} style={{
                                        padding: '0.5rem 0',
                                        borderBottom: '1px solid var(--border)',
                                        fontSize: '0.9rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 500 }}>{r.course_name}</span>
                                            <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: r.status === 'pending' ? 'var(--accent)' : 'var(--success)' }}>{r.status}</span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.request_type}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>

                {/* Main Content */}
                <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ marginBottom: '1rem' }}>Available Courses</h2>

                        {/* Regular (Core) Courses - Always Visible */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Core Courses</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {regularCourses.map(course => (
                                    <Card key={course.id} style={{ borderLeft: '4px solid var(--primary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span className="badge badge-indigo">Regular</span>
                                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{course.credits} Credits</span>
                                        </div>
                                        <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{course.course_code}</h4>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{course.course_name}</p>
                                        <Button variant="secondary" disabled style={{ width: '100%', fontSize: '0.8rem' }}>Pre-Assigned</Button>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Elective Courses - Always Visible */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Electives</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {electiveCourses.map(course => {
                                    const isRegistered = registeredCourses.some(rc => rc.id === course.id);
                                    return (
                                        <Card key={course.id}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span className="badge badge-yellow">Elective</span>
                                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{course.credits} Credits</span>
                                            </div>
                                            <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{course.course_code}</h4>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{course.course_name}</p>

                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Button
                                                    variant={isRegistered ? "secondary" : "primary"}
                                                    disabled={isRegistered}
                                                    onClick={() => handleRegister(course)}
                                                    style={{ flex: 1 }}
                                                >
                                                    {isRegistered ? "Registered" : "Register"}
                                                </Button>
                                                {/* Sem 7 Exception Request */}
                                                {parseInt(student.semester) === 7 && !isRegistered && (
                                                    <Button variant="secondary" onClick={() => {
                                                        setRequestForm({ ...requestForm, course_name: course.course_name });
                                                        setIsExceptionModalOpen(true);
                                                    }} title="Request as Exception">
                                                        <IoWarning />
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Specialization Selection */}
                        {[5, 6, 7].includes(parseInt(student.semester)) && (
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Specialization (Honor / Minor)</h3>

                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <Button
                                        variant={specializationType === 'honor' ? 'primary' : 'secondary'}
                                        onClick={() => toggleSpecialization('honor')}
                                        style={{ flex: 1, padding: '1rem' }}
                                    >
                                        View Honors Courses
                                    </Button>
                                    <Button
                                        variant={specializationType === 'minor' ? 'primary' : 'secondary'}
                                        onClick={() => toggleSpecialization('minor')}
                                        style={{ flex: 1, padding: '1rem' }}
                                    >
                                        View Minors Courses
                                    </Button>
                                </div>

                                {specializationType !== 'none' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 fade-in">
                                        {displayedSpecializationCourses.length === 0 ? (
                                            <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-white)', borderRadius: 'var(--radius)' }}>
                                                No {specializationType} courses available.
                                            </div>
                                        ) : displayedSpecializationCourses.map(course => {
                                            const isRegistered = registeredCourses.some(rc => rc.id === course.id);
                                            const hasMinor = registeredCourses.some(c => c.type === 'Minor');
                                            const hasHonor = registeredCourses.some(c => c.type === 'Honors');
                                            const isMinor = course.type === 'Minor';

                                            let isDisabled = isRegistered;
                                            if (!isRegistered) {
                                                // Mutually Exclusive Logic
                                                if (isMinor && hasHonor) isDisabled = true;
                                                if (!isMinor && hasMinor) isDisabled = true; // Honors disabled if Minor taken
                                                if (isMinor && hasMinor) isDisabled = true;  // Minor disabled if Minor taken (only 1 allowed usually, or logic allows multiple minors?) 
                                                // User ref: "Allow selection of ONLY ONE (Honor OR Minor)" -> Singular.
                                                if (!isMinor && hasHonor) isDisabled = true; // Honors disabled if Honors taken
                                            }

                                            return (
                                                <Card key={course.id}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <span className={`badge ${course.type === 'Minor' ? 'badge-blue' : 'badge-green'}`}>{course.type}</span>
                                                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{course.credits} Credits</span>
                                                    </div>
                                                    <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{course.course_code}</h4>
                                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{course.course_name}</p>
                                                    <Button
                                                        variant={isRegistered ? "secondary" : "primary"}
                                                        disabled={isDisabled}
                                                        onClick={() => handleRegister(course)}
                                                        style={{ width: '100%' }}
                                                    >
                                                        {isRegistered ? "Registered" : (isDisabled ? "Unavailable" : "Select")}
                                                    </Button>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add-On Course Modal */}
            <Modal isOpen={isAddonModalOpen} onClose={() => setIsAddonModalOpen(false)} title="Request Add-On Course">
                <div className="form-group">
                    <label className="form-label">Course Name</label>
                    <input
                        type="text"
                        value={requestForm.course_name}
                        onChange={(e) => setRequestForm({ ...requestForm, course_name: e.target.value })}
                        placeholder="e.g. Advanced Python"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Duration / Details</label>
                    <input
                        type="text"
                        value={requestForm.details}
                        onChange={(e) => setRequestForm({ ...requestForm, details: e.target.value })}
                        placeholder="e.g. 4 Weeks"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Course Type</label>
                    <select
                        className="form-control"
                        value={requestForm.course_type}
                        onChange={(e) => setRequestForm({ ...requestForm, course_type: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="Add-On">Add-On</option>
                        <option value="Honor">Honor</option>
                        <option value="Minor">Minor</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Course Credit</label>
                    <input
                        type="number"
                        value={requestForm.credits}
                        onChange={(e) => setRequestForm({ ...requestForm, credits: e.target.value })}
                        placeholder="e.g. 3"
                        min="1"
                    />
                </div>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => handleRequestSubmit('addon')}>
                    Submit Request
                </Button>
            </Modal>

            {/* Exception Request Modal */}
            <Modal isOpen={isExceptionModalOpen} onClose={() => setIsExceptionModalOpen(false)} title="Request Exception">
                <div className="form-group">
                    <label className="form-label">Course Name</label>
                    <input
                        type="text"
                        value={requestForm.course_name}
                        readOnly
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Reason / Details</label>
                    <textarea
                        value={requestForm.details}
                        onChange={(e) => setRequestForm({ ...requestForm, details: e.target.value })}
                        placeholder="Why do you need this exception?"
                        rows={3}
                    />
                </div>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => handleRequestSubmit('exception')}>
                    Submit Exception Request
                </Button>
            </Modal>
        </div>
    );
}

export default StudentDashboard;
