"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    createInvitation,
    deleteInvitation,
    getAdminEmail,
    type Invitation,
    listInvitations,
    regenerateQrCode as requestNewQrCode,
    setInvitationPhoto,
    signInAdmin,
    signOutAdmin,
    updateInvitation,
} from "../lib/admin";
import { errorMessage, invitationPhotoUrl } from "../lib/api";
import { resizePhoto } from "../lib/photo";
import { GuestQr } from "./guest-qr";

type AuthStatus = "checking" | "signedOut" | "signedIn";

function initials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((part) => part[0]?.toLocaleUpperCase("vi"))
        .join("");
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}

function DevLogin({
    onSignedIn,
}: {
    onSignedIn: (email: string) => void;
}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            onSignedIn(await signInAdmin(email, password));
        } catch (loginError) {
            setError(errorMessage(loginError, "Không thể đăng nhập quản trị."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="dev-auth-shell">
            <Link className="dev-auth-back" href="/">
                ← QUAY VỀ THIỆP
            </Link>

            <section className="dev-login-card" aria-labelledby="dev-login-title">
                <div className="dev-login-tape" aria-hidden="true" />
                <div className="dev-login-doodle" aria-hidden="true">
                    <span>↘</span>
                    <b>admin only!</b>
                </div>
                <span className="dev-login-kicker">GRAD_CONTROL.EXE</span>
                <div className="dev-login-icon" aria-hidden="true">
                    {"{ }"}
                </div>
                <h1 id="dev-login-title">Đăng nhập quản trị</h1>
                <p>
                    Dùng tài khoản Supabase của Đạt để mở dashboard khách mời.
                    Nhớ đăng xuất khi dùng máy lạ.
                </p>

                <form onSubmit={submitLogin}>
                    <label htmlFor="admin-email">Email quản trị</label>
                    <input
                        id="admin-email"
                        name="email"
                        type="email"
                        value={email}
                        placeholder="you@example.com"
                        autoComplete="username"
                        required
                        onChange={(event) => setEmail(event.target.value)}
                    />

                    <label htmlFor="admin-password">Mật khẩu</label>
                    <input
                        id="admin-password"
                        name="password"
                        type="password"
                        value={password}
                        minLength={8}
                        maxLength={200}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                        onChange={(event) => setPassword(event.target.value)}
                    />

                    {error ? (
                        <p className="dev-login-error" role="alert">
                            {error}
                        </p>
                    ) : null}

                    <button type="submit" disabled={submitting}>
                        {submitting ? "ĐANG KIỂM TRA..." : "MỞ DASHBOARD →"}
                    </button>
                </form>

                <small>
                    Supabase Auth • Row Level Security • admin only
                </small>
            </section>
        </main>
    );
}

export function DevDashboard() {
    const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
    const [adminEmail, setAdminEmail] = useState("");
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [displayName, setDisplayName] = useState("");
    const [instagramHandle, setInstagramHandle] = useState("");
    const [personalMessage, setPersonalMessage] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [editingId, setEditingId] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [regeneratingId, setRegeneratingId] = useState("");

    const loadInvitations = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const adminEmail = await getAdminEmail();
            if (!adminEmail) {
                setAuthStatus("signedOut");
                setAdminEmail("");
                return;
            }

            setInvitations(await listInvitations());
        } catch (loadError) {
            setError(errorMessage(loadError, "Không thể kết nối Supabase."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const email = await getAdminEmail();
                if (!email) {
                    setAuthStatus("signedOut");
                    return;
                }

                setAdminEmail(email);
                setAuthStatus("signedIn");
            } catch {
                setAuthStatus("signedOut");
            }
        };

        void checkSession();
    }, []);

    useEffect(() => {
        if (authStatus === "signedIn") {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Load protected data after the auth session is confirmed.
            void loadInvitations();
        }
    }, [authStatus, loadInvitations]);

    const totalCharacters = useMemo(
        () =>
            invitations.reduce(
                (total, invitation) =>
                    total + invitation.personal_message.length,
                0,
            ),
        [invitations],
    );

    const photoFileUrl = useMemo(
        () => (photoFile ? URL.createObjectURL(photoFile) : ""),
        [photoFile],
    );

    useEffect(() => {
        return () => {
            if (photoFileUrl) {
                URL.revokeObjectURL(photoFileUrl);
            }
        };
    }, [photoFileUrl]);

    const savedPhotoPath = removePhoto
        ? null
        : invitations.find((invitation) => invitation.id === editingId)?.photo_path;
    const photoPreview =
        photoFileUrl || (savedPhotoPath ? invitationPhotoUrl(savedPhotoPath) : "");

    const clearPhoto = (remove: boolean) => {
        setPhotoFile(null);
        setRemovePhoto(remove);
        if (photoInputRef.current) {
            photoInputRef.current.value = "";
        }
    };

    const resetForm = () => {
        clearPhoto(false);
        setEditingId("");
        setDisplayName("");
        setInstagramHandle("");
        setPersonalMessage("");
        setQrCode("");
    };

    const startEditing = (invitation: Invitation) => {
        clearPhoto(false);
        setEditingId(invitation.id);
        setDisplayName(invitation.display_name);
        setInstagramHandle(invitation.instagram_handle ?? "");
        setPersonalMessage(invitation.personal_message);
        setQrCode(invitation.qr_code);
        setError("");
        setSuccess("");
        document.getElementById("guest-name")?.focus();
    };

    const submitInvitation = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            const input = {
                displayName,
                instagramHandle,
                personalMessage,
                qrCode,
            };

            // Thu nhỏ ảnh trước, để ảnh hỏng không làm dở dang việc lưu khách.
            const photo = photoFile ? await resizePhoto(photoFile) : null;
            let saved = editingId
                ? await updateInvitation(editingId, input)
                : await createInvitation(input);
            let photoError = "";

            try {
                if (photo) {
                    saved = await setInvitationPhoto(saved, photo);
                } else if (removePhoto && saved.photo_path) {
                    saved = await setInvitationPhoto(saved, null);
                }
            } catch (uploadError) {
                photoError = errorMessage(uploadError, "Không thể tải ảnh lên.");
            }

            const savedInvitation = saved;
            setInvitations((current) =>
                editingId
                    ? current.map((invitation) =>
                          invitation.id === editingId ? savedInvitation : invitation,
                      )
                    : [savedInvitation, ...current],
            );
            resetForm();

            if (photoError) {
                setError(`Đã lưu ${saved.display_name} nhưng chưa lưu được ảnh: ${photoError}`);
            } else {
                setSuccess(
                    editingId
                        ? `Đã lưu thay đổi cho ${saved.display_name}.`
                        : `Đã thêm ${saved.display_name} vào danh sách.`,
                );
            }
        } catch (submitError) {
            setError(errorMessage(submitError, "Không thể kết nối Supabase."));
        } finally {
            setSubmitting(false);
        }
    };

    const removeInvitation = async (invitation: Invitation) => {
        setError("");
        setSuccess("");

        try {
            await deleteInvitation(invitation.id);
            setInvitations((current) =>
                current.filter((item) => item.id !== invitation.id),
            );
            if (editingId === invitation.id) {
                resetForm();
            }
            setSuccess(`Đã xoá ${invitation.display_name} khỏi danh sách.`);
        } catch (deleteError) {
            setError(errorMessage(deleteError, "Không thể kết nối Supabase."));
        }
    };

    const regenerateQrCode = async (invitationId: string) => {
        setRegeneratingId(invitationId);
        setError("");
        setSuccess("");

        try {
            const updated = await requestNewQrCode(invitationId);
            setInvitations((current) =>
                current.map((invitation) =>
                    invitation.id === invitationId ? updated : invitation,
                ),
            );
            if (editingId === invitationId) {
                setQrCode(updated.qr_code);
            }
            setSuccess(`Đã tạo QR mới cho ${updated.display_name}. QR cũ không còn dùng được.`);
        } catch (updateError) {
            setError(errorMessage(updateError, "Không thể kết nối Supabase."));
        } finally {
            setRegeneratingId("");
        }
    };

    const signOut = async () => {
        try {
            await signOutAdmin();
        } finally {
            setInvitations([]);
            setAdminEmail("");
            setAuthStatus("signedOut");
        }
    };

    if (authStatus === "checking") {
        return (
            <main className="dev-auth-shell">
                <div className="dev-auth-checking" role="status">
                    <span>{"{ ... }"}</span>
                    <strong>Đang kiểm tra phiên quản trị</strong>
                    <small>auth.session()</small>
                </div>
            </main>
        );
    }

    if (authStatus === "signedOut") {
        return (
            <DevLogin
                onSignedIn={(email) => {
                    setAdminEmail(email);
                    setAuthStatus("signedIn");
                }}
            />
        );
    }

    return (
        <main className="dev-shell">
            <aside className="dev-sidebar">
                <Link className="dev-brand" href="/">
                    <span>LD</span>
                    <div>
                        <strong>GRAD CONTROL</strong>
                        <small>guest dashboard</small>
                    </div>
                </Link>

                <nav aria-label="Điều hướng dashboard">
                    <Link className="is-active" href="/dev">
                        <span>01</span>
                        Khách mời
                    </Link>
                    <Link href="/dev/logs">
                        <span>02</span>
                        Visit logs
                    </Link>
                    <Link href="/">
                        <span>03</span>
                        Xem theme
                    </Link>
                </nav>

                <div className="dev-sidebar-note">
                    <span>AUTH_REQUIRED</span>
                    <p>
                        Dashboard được bảo vệ bằng Supabase Auth và Row Level
                        Security.
                    </p>
                </div>
            </aside>

            <div className="dev-workspace">
                <header className="dev-header">
                    <div>
                        <p>GUEST_LIST.DEV</p>
                        <h1>Quản lý khách mời</h1>
                        <span>
                            Quản lý lời mời và mã QR riêng của từng khách.
                        </span>
                    </div>
                    <div className="dev-header-actions">
                        <span>{adminEmail}</span>
                        <Link href="/">XEM THIỆP ↗</Link>
                        <button type="button" onClick={() => void signOut()}>
                            ĐĂNG XUẤT
                        </button>
                    </div>
                </header>

                <section className="dev-stats" aria-label="Thống kê khách mời">
                    <article>
                        <small>TỔNG KHÁCH MỜI</small>
                        <strong>{invitations.length.toString().padStart(2, "0")}</strong>
                        <span>records in database</span>
                    </article>
                    <article>
                        <small>TRẠNG THÁI API</small>
                        <strong className={error ? "is-error" : "is-online"}>
                            {error ? "CHECK" : "ONLINE"}
                        </strong>
                        <span>Supabase connected</span>
                    </article>
                    <article>
                        <small>NỘI DUNG ĐÃ VIẾT</small>
                        <strong>{totalCharacters}</strong>
                        <span>ký tự lời mời</span>
                    </article>
                </section>

                <section className="dev-content">
                    <div className="dev-form-panel">
                        <div className="dev-panel-heading">
                            <span>{editingId ? "EDIT_GUEST" : "NEW_GUEST"}</span>
                            <h2>{editingId ? "Sửa khách mời" : "Thêm khách mời"}</h2>
                            <p>
                                {editingId
                                    ? "Đổi mã QR sẽ làm QR cũ của khách này hết hiệu lực."
                                    : "Để trống mã QR thì hệ thống tự tạo mã ngẫu nhiên."}
                            </p>
                        </div>

                        <form onSubmit={submitInvitation}>
                            <label htmlFor="guest-name">
                                <span>01</span>
                                Tên khách mời
                            </label>
                            <input
                                id="guest-name"
                                name="displayName"
                                type="text"
                                value={displayName}
                                maxLength={120}
                                placeholder="Ví dụ: Nguyễn Minh Anh"
                                autoComplete="off"
                                required
                                onChange={(event) => setDisplayName(event.target.value)}
                            />

                            <label htmlFor="guest-instagram">
                                <span>02</span>
                                Instagram (không bắt buộc)
                            </label>
                            <input
                                id="guest-instagram"
                                name="instagramHandle"
                                type="text"
                                value={instagramHandle}
                                maxLength={31}
                                pattern="@[A-Za-z0-9._]{1,30}"
                                placeholder="@username"
                                autoCapitalize="none"
                                autoComplete="off"
                                spellCheck={false}
                                aria-describedby="guest-instagram-hint"
                                onChange={(event) =>
                                    setInstagramHandle(event.target.value)
                                }
                            />
                            <small
                                className="dev-field-hint"
                                id="guest-instagram-hint"
                            >
                                Hệ thống phân biệt chính xác chữ hoa và chữ thường.
                            </small>

                            <label htmlFor="guest-message">
                                <span>03</span>
                                Lời mời
                            </label>
                            <textarea
                                id="guest-message"
                                name="personalMessage"
                                value={personalMessage}
                                maxLength={1200}
                                placeholder="Viết một lời mời riêng dành cho người bạn này..."
                                rows={8}
                                required
                                onChange={(event) =>
                                    setPersonalMessage(event.target.value)
                                }
                            />
                            <div className="dev-char-count">
                                {personalMessage.length} / 1.200
                            </div>

                            <label htmlFor="guest-qr-code">
                                <span>04</span>
                                Mã QR (không bắt buộc)
                            </label>
                            <input
                                id="guest-qr-code"
                                name="qrCode"
                                type="text"
                                value={qrCode}
                                minLength={8}
                                maxLength={64}
                                pattern="[A-Za-z0-9_\-]{8,64}"
                                placeholder="Để trống = mã ngẫu nhiên"
                                autoCapitalize="none"
                                autoComplete="off"
                                spellCheck={false}
                                aria-describedby="guest-qr-code-hint"
                                onChange={(event) => setQrCode(event.target.value)}
                            />
                            <small className="dev-field-hint" id="guest-qr-code-hint">
                                8–64 ký tự: chữ không dấu, số, - hoặc _. Ai đoán được
                                mã cũng mở được thiệp, nên đừng đặt mã quá dễ đoán.
                            </small>

                            <label htmlFor="guest-photo">
                                <span>05</span>
                                Ảnh chụp chung (không bắt buộc)
                            </label>
                            <div className="dev-photo-field">
                                {photoPreview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={photoPreview} alt="Ảnh chụp chung đang chọn" />
                                ) : null}
                                <input
                                    ref={photoInputRef}
                                    id="guest-photo"
                                    name="photo"
                                    type="file"
                                    accept="image/*"
                                    aria-describedby="guest-photo-hint"
                                    onChange={(event) => {
                                        setPhotoFile(event.target.files?.[0] ?? null);
                                        setRemovePhoto(false);
                                    }}
                                />
                                {photoPreview ? (
                                    <button type="button" onClick={() => clearPhoto(true)}>
                                        GỠ ẢNH ✕
                                    </button>
                                ) : null}
                            </div>
                            <small className="dev-field-hint" id="guest-photo-hint">
                                Ảnh của bạn và khách, hiện trên trang thiệp riêng của
                                họ. Ảnh được tự thu nhỏ trước khi tải lên.
                            </small>

                            {error ? (
                                <p className="dev-feedback is-error" role="alert">
                                    {error}
                                </p>
                            ) : null}
                            {success ? (
                                <p className="dev-feedback is-success" role="status">
                                    {success}
                                </p>
                            ) : null}

                            <button type="submit" disabled={submitting}>
                                <span>
                                    {submitting
                                        ? "ĐANG LƯU..."
                                        : editingId
                                          ? "LƯU THAY ĐỔI"
                                          : "THÊM KHÁCH MỜI"}
                                </span>
                                <b aria-hidden="true">{editingId ? "✓" : "＋"}</b>
                            </button>
                            {editingId ? (
                                <button
                                    type="button"
                                    className="dev-form-cancel"
                                    onClick={resetForm}
                                >
                                    <span>HUỶ SỬA</span>
                                    <b aria-hidden="true">✕</b>
                                </button>
                            ) : null}
                        </form>
                    </div>

                    <div className="dev-list-panel">
                        <div className="dev-list-heading">
                            <div>
                                <span>DATABASE_RECORDS</span>
                                <h2>Danh sách hiện tại</h2>
                            </div>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => void loadInvitations()}
                            >
                                {loading ? "LOADING..." : "REFRESH ↻"}
                            </button>
                        </div>

                        {loading ? (
                            <div className="dev-empty">
                                <strong>Đang đọc dữ liệu...</strong>
                                <span>supabase.query(invitations)</span>
                            </div>
                        ) : invitations.length === 0 ? (
                            <div className="dev-empty">
                                <strong>Chưa có khách mời.</strong>
                                <span>Hãy thêm người đầu tiên từ biểu mẫu bên trái.</span>
                            </div>
                        ) : (
                            <div className="dev-guest-list">
                                {invitations.map((invitation, index) => (
                                    <article key={invitation.id}>
                                        <div className="dev-avatar">
                                            {initials(invitation.display_name)}
                                        </div>
                                        <div className="dev-guest-copy">
                                            <div>
                                                <strong>
                                                    {invitation.display_name}
                                                </strong>
                                                <span>
                                                    #{String(
                                                        invitations.length - index,
                                                    ).padStart(2, "0")}
                                                </span>
                                            </div>
                                            <p>{invitation.personal_message}</p>
                                            <small>
                                                {invitation.instagram_handle ?? "—"}
                                                {invitation.photo_path ? <em>ẢNH ✓</em> : null}
                                                <em>
                                                    TOKEN: {invitation.token.slice(0, 8)}…
                                                </em>
                                                <b>
                                                    {formatDate(invitation.created_at)}
                                                </b>
                                            </small>
                                            <GuestQr
                                                displayName={invitation.display_name}
                                                personalMessage={invitation.personal_message}
                                                qrCode={invitation.qr_code}
                                                regenerating={regeneratingId === invitation.id}
                                                onRegenerate={() =>
                                                    void regenerateQrCode(invitation.id)
                                                }
                                                onEdit={() => startEditing(invitation)}
                                                onDelete={() =>
                                                    void removeInvitation(invitation)
                                                }
                                                onError={setError}
                                            />
                                        </div>
                                        <span className="dev-ready">READY</span>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
