import React, { useState } from "react";
import { db, auth, storage } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Avatar from "@/components/Avatar";

const defaultProfile = {
  name: "",
  status: "",
  about: "",
  email: "",
  skills: [],
  interests: [],
  education: [],
  experience: [],
  certificates: [],
  avatarUrl: "",
  bannerUrl: ""
};

export default function ProfileEditForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<any>(initial || defaultProfile);
  const [newSkill, setNewSkill] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Skills
  const addSkill = () => {
    if (newSkill.trim()) {
      setForm({ ...form, skills: [...(form.skills || []), newSkill.trim()] });
      setNewSkill("");
    }
  };
  const removeSkill = (idx: number) => {
    setForm({ ...form, skills: form.skills.filter((_: string, i: number) => i !== idx) });
  };

  // Аватар
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((prev: any) => ({ ...prev, avatarUrl: url }));
    } catch (e) {
      alert("Ошибка загрузки файла");
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    await setDoc(doc(db, "users", auth.currentUser.uid), form, { merge: true });
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center gap-2 mb-4">
        <Avatar src={form.avatarUrl} name={form.name} email={form.email} size={80} />
        <label className="cursor-pointer text-[#A166FF] hover:underline">
          Сменить аватар
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>
      <input
        name="name"
        value={form.name || ""}
        onChange={handleChange}
        className="text-2xl font-bold mb-2 w-full px-4 py-2 rounded border border-[#EAD7FF]"
        placeholder="Имя Фамилия"
      />
      <input
        name="status"
        value={form.status || ""}
        onChange={handleChange}
        className="text-[#A166FF] font-medium mb-2 w-full px-4 py-2 rounded border border-[#EAD7FF]"
        placeholder="Статус, факультет, курс"
      />
      <textarea
        name="about"
        value={form.about || ""}
        onChange={handleChange}
        className="mb-2 w-full px-4 py-2 rounded border border-[#EAD7FF]"
        placeholder="О себе..."
      />
      <input
        name="email"
        value={form.email || ""}
        onChange={handleChange}
        className="mb-2 w-full px-4 py-2 rounded border border-[#EAD7FF]"
        placeholder="Email"
        type="email"
        disabled
      />
      {/* Skills */}
      <div className="mb-2">
        <label className="block font-medium">Навыки</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {(form.skills || []).map((skill: string, idx: number) => (
            <span key={idx} className="px-3 py-1 rounded-full bg-[#F3EDFF] text-[#A166FF] text-sm font-medium flex items-center gap-1">
              {skill}
              <button type="button" onClick={() => removeSkill(idx)} className="ml-1">×</button>
            </span>
          ))}
        </div>
        <input
          value={newSkill}
          onChange={e => setNewSkill(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { addSkill(); e.preventDefault(); }}}
          placeholder="Добавить навык и нажать Enter"
          className="w-full px-4 py-2 rounded border border-[#EAD7FF]"
        />
      </div>
      <div className="flex gap-4 mt-4">
        <button
          type="submit"
          className="px-6 py-2 rounded bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition"
          disabled={uploading}
        >
          Сохранить
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
        >
          Отмена
        </button>
      </div>
    </form>
  );
} 