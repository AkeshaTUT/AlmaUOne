import React, { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import BackButton from '@/components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  FileImage, 
  FileVideo, 
  File, 
  Upload, 
  Search, 
  Download, 
  Trash2, 
  X, 
  Tag, 
  Calendar,
  BookOpen,
  Loader2,
  Plus
} from 'lucide-react';

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
      return <FileText className="w-8 h-8 text-red-500" />;
    case 'doc':
      return <FileText className="w-8 h-8 text-blue-500" />;
    case 'image':
      return <FileImage className="w-8 h-8 text-green-500" />;
    case 'video':
      return <FileVideo className="w-8 h-8 text-purple-500" />;
    default:
      return <File className="w-8 h-8 text-gray-500" />;
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
    <motion.div 
      className="min-h-screen bg-[#F8F6FB] p-2 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton className="mb-2 sm:mb-4" />
      <motion.div 
        className="w-full max-w-full sm:max-w-5xl mx-auto"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <motion.h1 
          className="text-2xl sm:text-3xl font-bold text-[#1E0E62] dark:text-white mb-4 sm:mb-8 flex items-center gap-2 sm:gap-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-[#A166FF]" />
          Материалы
        </motion.h1>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск материалов..."
              className="w-full pl-10 pr-4 py-3 rounded-md sm:rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-white dark:bg-[#232336] dark:text-white transition-all duration-200 text-sm sm:text-base"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <motion.button
            onClick={() => setOpenUpload(true)}
            className="mt-2 sm:mt-0 px-4 sm:px-6 py-3 rounded-md sm:rounded-lg bg-[#A166FF] text-white font-semibold shadow hover:bg-[#8A4FD8] transition-colors duration-200 flex items-center gap-2 text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            Загрузить материал
          </motion.button>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {filteredMaterials.length === 0 ? (
            <motion.div 
              className="col-span-full text-center py-8 sm:py-12 text-[#8E8E93] dark:text-[#B0B0B0]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <File className="w-16 h-16 mx-auto mb-4 text-[#A166FF] opacity-50" />
              <p className="text-lg">Материалы не найдены</p>
              <p className="text-sm">Загрузите первый материал, чтобы начать</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredMaterials.map((material, index) => (
                <motion.div 
                  key={material.id} 
                  className="bg-white dark:bg-[#232336] rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-6 flex flex-col gap-2 border border-[#F3EDFF] dark:border-[#232336]"
                  initial={{ y: 20, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  exit={{ y: -20, opacity: 0, scale: 0.9 }}
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div>{getFileIcon(material.type)}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-[#1E0E62] dark:text-white text-base sm:text-lg line-clamp-1">{material.title}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <BookOpen className="w-3 h-3" />
                        {material.subject}
                      </div>
                    </div>
                    <motion.button
                      className="ml-2 px-2 sm:px-3 py-2 rounded-md sm:rounded-lg bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 transition-colors duration-200"
                      onClick={() => handleDelete(material.id, material.url)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </motion.button>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Загружено: {formatDate(material.uploadDate)}
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
                    {material.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF] rounded-full text-xs flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1 sm:gap-2 mt-auto">
                    <motion.a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 sm:px-4 py-2 rounded-md sm:rounded-lg bg-[#F3EDFF] text-[#A166FF] font-semibold hover:bg-[#EAD7FF] text-xs sm:text-sm flex items-center gap-2 transition-colors duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Download className="w-4 h-4" />
                      Скачать
                    </motion.a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>
        
        {/* Диалог загрузки материала */}
        <AnimatePresence>
          {openUpload && (
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-white dark:bg-[#232336] rounded-lg sm:rounded-2xl p-4 sm:p-8 w-full max-w-xs sm:max-w-md shadow-md sm:shadow-lg relative"
                initial={{ y: 50, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 50, opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 text-xl sm:text-2xl text-gray-400 hover:text-[#A166FF] transition-colors duration-200"
                  onClick={() => setOpenUpload(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
                <motion.h2 
                  className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-[#1E0E62] dark:text-white flex items-center gap-2"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Upload className="w-6 h-6 text-[#A166FF]" />
                  Загрузить материал
                </motion.h2>
                <motion.div 
                  className="space-y-3 sm:space-y-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <input
                    type="text"
                    name="title"
                    placeholder="Название материала"
                    className="w-full px-3 sm:px-4 py-3 rounded-md sm:rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200 text-sm sm:text-base"
                    value={newMaterial.title}
                    onChange={handleInputChange}
                  />
                  <input
                    type="text"
                    name="subject"
                    placeholder="Предмет"
                    className="w-full px-3 sm:px-4 py-3 rounded-md sm:rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200 text-sm sm:text-base"
                    value={newMaterial.subject}
                    onChange={handleInputChange}
                  />
                  <textarea
                    name="description"
                    placeholder="Описание (необязательно)"
                    className="w-full px-3 sm:px-4 py-3 rounded-md sm:rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200 text-sm sm:text-base"
                    value={newMaterial.description}
                    onChange={handleInputChange}
                    rows={2}
                  />
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Теги (Enter для добавления)"
                      className="w-full px-3 sm:px-4 py-3 rounded-md sm:rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200 text-sm sm:text-base"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                    />
                    <div className="flex gap-1 flex-wrap">
                      {newMaterial.tags.map(tag => (
                        <motion.span 
                          key={tag} 
                          className="px-2 py-1 bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF] rounded-full text-xs cursor-pointer flex items-center gap-1" 
                          onClick={() => handleRemoveTag(tag)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Tag className="w-3 h-3" />
                          {tag} 
                          <X className="w-3 h-3" />
                        </motion.span>
                      ))}
                    </div>
                  </div>
                  <div className="border-2 border-dashed border-[#EAD7FF] rounded-lg p-4 text-center">
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.wmv"
                      id="file-upload"
                    />
                    <label 
                      htmlFor="file-upload" 
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="w-8 h-8 text-[#A166FF]" />
                      <span className="text-[#A166FF] font-medium">Выберите файл</span>
                      {selectedFile && (
                        <span className="text-sm text-gray-500">{selectedFile.name}</span>
                      )}
                    </label>
                  </div>
                  {uploadError && (
                    <motion.div 
                      className="text-red-500 text-sm p-3 bg-red-50 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {uploadError}
                    </motion.div>
                  )}
                  <motion.button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full px-3 sm:px-4 py-3 rounded-md sm:rounded-lg bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-base"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                    {uploading ? 'Загрузка...' : 'Загрузить'}
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default MaterialsPage;
