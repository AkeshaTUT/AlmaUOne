import { Story } from '@/types/story';

interface StoryBarProps {
  stories: Story[];
  onStoryClick: (story: Story) => void;
  onAddClick: () => void;
  currentUser?: { userName: string; userAvatar: string };
}

const StoryBar: React.FC<StoryBarProps> = ({ stories, onStoryClick, onAddClick, currentUser }) => (
  <div className="flex gap-4 overflow-x-auto py-2 px-2 scrollbar-thin scrollbar-thumb-[#EAD7FF]">
    {/* Кнопка добавить историю */}
    <div className="flex flex-col items-center cursor-pointer" onClick={onAddClick}>
      <div className="story-avatar">
        <div className="story-avatar-inner flex items-center justify-center w-14 h-14 bg-gray-200">
          {currentUser?.userAvatar ? (
            <img src={currentUser.userAvatar} alt="Ваша история" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <span className="text-2xl text-[#A166FF]">+</span>
          )}
        </div>
      </div>
      <span className="text-xs mt-1 w-16 truncate text-center">Ваша история</span>
    </div>
    {/* Истории пользователей */}
    {stories.map(story => (
      <div
        key={story.id}
        className="flex flex-col items-center cursor-pointer"
        onClick={() => onStoryClick(story)}
      >
        <div className="story-avatar">
          <div className="story-avatar-inner">
            <img
              src={story.userAvatar}
              alt={story.userName}
              className="w-14 h-14 rounded-full object-cover"
            />
          </div>
        </div>
        <span className="text-xs mt-1 w-16 truncate text-center">{story.userName}</span>
      </div>
    ))}
    <style jsx="true" global="true">{`
      .story-avatar {
        border-radius: 9999px;
        background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
        padding: 2px;
        display: inline-block;
      }
      .story-avatar-inner {
        border-radius: 9999px;
        background: #fff;
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `}</style>
  </div>
);

export default StoryBar; 