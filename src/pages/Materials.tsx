import React, { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import BackButton from '@/components/BackButton';

// Типы для материалов
interface Material {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'image' | 'video' | 'other';
  subject: string;
  uploadedBy: string;
  uploadDate: string;
  size: string;
  url: string;
  tags: string[];
  description?: string;
}

// Иконка для типа файла
const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <span className="text-red-500">📄</span>;
    case 'doc':
      return <span className="text-blue-500">📝</span>;
    case 'image':
      return <span className="text-green-500">🖼️</span>;
    case 'video':
      return <span className="text-purple-500">🎬</span>;
    default:
      return <span>📁</span>;
  }
};

// Форматирование даты
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openUpload, setOpenUpload] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Omit<Material, 'id' | 'url'>>({
    title: '',
    type: 'pdf',
    subject: '',
    uploadedBy: 'Вы',
    uploadDate: new Date().toISOString().split('T')[0],
    size: '0',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const storage = getStorage(app);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchMaterials = async () => {
      const materialsRef = collection(db, 'materials');
      const q = query(materialsRef, orderBy('uploadDate', 'desc'));
      const querySnapshot = await getDocs(q);
      const materialsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Material[];
      setMaterials(materialsData);
    };
    fetchMaterials();
  }, [db]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewMaterial(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setNewMaterial(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewMaterial(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
      const extension = file.name.split('.').pop()?.toLowerCase();
      let type: Material['type'] = 'other';
      if (extension === 'pdf') type = 'pdf';
      else if (['doc', 'docx'].includes(extension || '')) type = 'doc';
      else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) type = 'image';
      else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) type = 'video';
      setNewMaterial(prev => ({ ...prev, type }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Пожалуйста, выберите файл для загрузки');
      return;
    }
    setUploading(true);
    try {
      const storageRef = ref(storage, `materials/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'materials'), {
        ...newMaterial,
        url,
        size: `${(selectedFile.size / 1024).toFixed(1)} KB`,
        uploadDate: new Date().toISOString(),
      });
      setOpenUpload(false);
      setNewMaterial({
        title: '',
        type: 'pdf',
        subject: '',
        uploadedBy: 'Вы',
        uploadDate: new Date().toISOString().split('T')[0],
        size: '0',
        tags: []
      });
      setSelectedFile(null);
      setUploadError(null);
      setUploading(false);
      // Обновить список
      const materialsRef = collection(db, 'materials');
      const q = query(materialsRef, orderBy('uploadDate', 'desc'));
      const querySnapshot = await getDocs(q);
      const materialsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Material[];
      setMaterials(materialsData);
    } catch (e) {
      setUploadError('Ошибка загрузки файла');
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, url: string) => {
    try {
      await deleteDoc(doc(db, 'materials', id));
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
      setMaterials(materials.filter(m => m.id !== id));
    } catch (e) {
      alert('Ошибка удаления файла');
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F8F6FB] p-8">
      <BackButton className="mb-4" />
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1E0E62] dark:text-white mb-8">Материалы</h1>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Поиск материалов..."
            className="flex-1 px-4 py-2 rounded border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-white dark:bg-[#232336] dark:text-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => setOpenUpload(true)}
            className="px-6 py-2 rounded bg-[#A166FF] text-white font-semibold shadow hover:bg-[#8A4FD8] transition"
          >
            Загрузить материал
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              Материалы не найдены
            </div>
          ) : (
            filteredMaterials.map(material => (
              <div key={material.id} className="bg-white dark:bg-[#232336] rounded-2xl shadow-lg p-6 flex flex-col gap-2 border border-[#F3EDFF]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl">{getFileIcon(material.type)}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-[#1E0E62] dark:text-white text-lg line-clamp-1">{material.title}</div>
                    <div className="text-xs text-gray-500">{material.subject}</div>
                  </div>
                  <button
                    className="ml-2 px-3 py-1 rounded bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200"
                    onClick={() => handleDelete(material.id, material.url)}
                  >
                    Удалить
                  </button>
                </div>
                <div className="text-sm text-gray-500 mb-1">Загружено: {formatDate(material.uploadDate)}</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {material.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF] rounded-full text-xs">{tag}</span>
                  ))}
                </div>
                <div className="flex gap-2 mt-auto">
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded bg-[#F3EDFF] text-[#A166FF] font-semibold hover:bg-[#EAD7FF] text-sm"
                  >
                    Скачать
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Диалог загрузки материала */}
        {openUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#232336] rounded-2xl p-8 w-full max-w-md shadow-lg relative">
              <button
                className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-[#A166FF]"
                onClick={() => setOpenUpload(false)}
              >×</button>
              <h2 className="text-xl font-bold mb-4 text-[#1E0E62] dark:text-white">Загрузить материал</h2>
              <input
                type="text"
                name="title"
                placeholder="Название материала"
                className="w-full px-4 py-2 rounded border border-[#EAD7FF] mb-3 bg-white dark:bg-[#181826] dark:text-white"
                value={newMaterial.title}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="subject"
                placeholder="Предмет"
                className="w-full px-4 py-2 rounded border border-[#EAD7FF] mb-3 bg-white dark:bg-[#181826] dark:text-white"
                value={newMaterial.subject}
                onChange={handleInputChange}
              />
              <textarea
                name="description"
                placeholder="Описание (необязательно)"
                className="w-full px-4 py-2 rounded border border-[#EAD7FF] mb-3 bg-white dark:bg-[#181826] dark:text-white"
                value={newMaterial.description}
                onChange={handleInputChange}
                rows={2}
              />
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Теги (Enter для добавления)"
                  className="flex-1 px-4 py-2 rounded border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
                <div className="flex gap-1 flex-wrap">
                  {newMaterial.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF] rounded-full text-xs cursor-pointer" onClick={() => handleRemoveTag(tag)}>{tag} ×</span>
                  ))}
                </div>
              </div>
              <input
                type="file"
                className="mb-3"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.wmv"
              />
              {uploadError && <div className="text-red-500 text-sm mb-2">{uploadError}</div>}
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full px-4 py-2 rounded bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition disabled:opacity-50"
              >
                {uploading ? 'Загрузка...' : 'Загрузить'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialsPage;
