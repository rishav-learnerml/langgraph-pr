export type SidebarContextType = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export type ChatHistoryType = {
    sessionId:string
    sessionName:string
}