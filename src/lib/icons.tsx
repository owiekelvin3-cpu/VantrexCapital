import type { ComponentType } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faPaypal } from "@fortawesome/free-brands-svg-icons";
import {
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowTrendDown,
  faArrowTrendUp,
  faArrowUp,
  faArrowUpRightFromSquare,
  faArrowsRotate,
  faAward,
  faBars,
  faBell,
  faBolt,
  faBoxArchive,
  faBrain,
  faBuilding,
  faCalendar,
  faCamera,
  faChartColumn,
  faChartLine,
  faCheck,
  faCheckDouble,
  faChevronDown,
  faChevronRight,
  faCircleCheck,
  faCircleQuestion,
  faCircleXmark,
  faClock,
  faClockRotateLeft,
  faCoins,
  faComments,
  faCopy,
  faCreditCard,
  faEarthAmericas,
  faEllipsis,
  faEnvelope,
  faExpand,
  faCompress,
  faEye,
  faEyeSlash,
  faFaceSmile,
  faFileCircleCheck,
  faFileLines,
  faGaugeHigh,
  faGear,
  faGift,
  faGlobe,
  faHammer,
  faHeadset,
  faImage,
  faKey,
  faLandmark,
  faLock,
  faMagnifyingGlass,
  faMagnifyingGlassPlus,
  faMoon,
  faPaperclip,
  faPaperPlane,
  faPlus,
  faRightFromBracket,
  faRobot,
  faRotateLeft,
  faServer,
  faShieldHalved,
  faStar,
  faSun,
  faTableCellsLarge,
  faThumbtack,
  faTowerBroadcast,
  faTrash,
  faTriangleExclamation,
  faUpload,
  faUser,
  faUserPlus,
  faUsers,
  faVolumeHigh,
  faWallet,
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export type IconProps = { className?: string };
export type IconComponent = ComponentType<IconProps>;

function createIcon(icon: IconDefinition, displayName: string): IconComponent {
  const Icon = ({ className }: IconProps) => (
    <FontAwesomeIcon icon={icon} className={className} fixedWidth />
  );
  Icon.displayName = displayName;
  return Icon;
}

export const Activity = createIcon(faChartLine, "Activity");
export const AlertTriangle = createIcon(faTriangleExclamation, "AlertTriangle");
export const ArrowDownToLine = createIcon(faArrowDown, "ArrowDownToLine");
export const ArrowLeft = createIcon(faArrowLeft, "ArrowLeft");
export const ArrowRight = createIcon(faArrowRight, "ArrowRight");
export const ArrowUpFromLine = createIcon(faArrowUp, "ArrowUpFromLine");
export const ArrowUpRight = createIcon(faArrowUpRightFromSquare, "ArrowUpRight");
export const Award = createIcon(faAward, "Award");
export const BarChart3 = createIcon(faChartColumn, "BarChart3");
export const Bell = createIcon(faBell, "Bell");
export const Bot = createIcon(faRobot, "Bot");
export const Brain = createIcon(faBrain, "Brain");
export const Building2 = createIcon(faBuilding, "Building2");
export const Camera = createIcon(faCamera, "Camera");
export const Calendar = createIcon(faCalendar, "Calendar");
export const CandlestickChart = createIcon(faChartLine, "CandlestickChart");
export const Check = createIcon(faCheck, "Check");
export const CheckCheck = createIcon(faCheckDouble, "CheckCheck");
export const CheckCircle = createIcon(faCircleCheck, "CheckCircle");
export const ChevronDown = createIcon(faChevronDown, "ChevronDown");
export const ChevronRight = createIcon(faChevronRight, "ChevronRight");
export const Clock = createIcon(faClock, "Clock");
export const Timer = createIcon(faClock, "Timer");
export const History = createIcon(faClockRotateLeft, "History");
export const Coins = createIcon(faCoins, "Coins");
export const Copy = createIcon(faCopy, "Copy");
export const CreditCard = createIcon(faCreditCard, "CreditCard");
export const ExternalLink = createIcon(faArrowUpRightFromSquare, "ExternalLink");
export const Eye = createIcon(faEye, "Eye");
export const EyeOff = createIcon(faEyeSlash, "EyeOff");
export const FileCheck = createIcon(faFileCircleCheck, "FileCheck");
export const FileText = createIcon(faFileLines, "FileText");
export const Gift = createIcon(faGift, "Gift");
export const Globe = createIcon(faGlobe, "Globe");
export const Globe2 = createIcon(faEarthAmericas, "Globe2");
export const HelpCircle = createIcon(faCircleQuestion, "HelpCircle");
export const ImageIcon = createIcon(faImage, "ImageIcon");
export const Key = createIcon(faKey, "Key");
export const Landmark = createIcon(faLandmark, "Landmark");
export const LayoutDashboard = createIcon(faGaugeHigh, "LayoutDashboard");
export const LayoutGrid = createIcon(faTableCellsLarge, "LayoutGrid");
export const LineChart = createIcon(faChartLine, "LineChart");
export const Lock = createIcon(faLock, "Lock");
export const LogOut = createIcon(faRightFromBracket, "LogOut");
export const Mail = createIcon(faEnvelope, "Mail");
export const Maximize2 = createIcon(faExpand, "Maximize2");
export const Minimize2 = createIcon(faCompress, "Minimize2");
export const Menu = createIcon(faBars, "Menu");
export const Moon = createIcon(faMoon, "Moon");
export const MoreHorizontal = createIcon(faEllipsis, "MoreHorizontal");
export const Pickaxe = createIcon(faHammer, "Pickaxe");
export const Plus = createIcon(faPlus, "Plus");
export const Radio = createIcon(faTowerBroadcast, "Radio");
export const RefreshCw = createIcon(faArrowsRotate, "RefreshCw");
export const Search = createIcon(faMagnifyingGlass, "Search");
export const Server = createIcon(faServer, "Server");
export const Settings = createIcon(faGear, "Settings");
export const Shield = createIcon(faShieldHalved, "Shield");
export const ShieldCheck = createIcon(faCircleCheck, "ShieldCheck");
export const Sparkles = createIcon(faWandMagicSparkles, "Sparkles");
export const Star = createIcon(faStar, "Star");
export const Sun = createIcon(faSun, "Sun");
export const TrendingDown = createIcon(faArrowTrendDown, "TrendingDown");
export const TrendingUp = createIcon(faArrowTrendUp, "TrendingUp");
export const Trash2 = createIcon(faTrash, "Trash2");
export const Upload = createIcon(faUpload, "Upload");
export const User = createIcon(faUser, "User");
export const UserPlus = createIcon(faUserPlus, "UserPlus");
export const Users = createIcon(faUsers, "Users");
export const Volume2 = createIcon(faVolumeHigh, "Volume2");
export const Wallet = createIcon(faWallet, "Wallet");
export const X = createIcon(faXmark, "X");
export const XCircle = createIcon(faCircleXmark, "XCircle");
export const Zap = createIcon(faBolt, "Zap");
export const ZoomIn = createIcon(faMagnifyingGlassPlus, "ZoomIn");

export const Archive = createIcon(faBoxArchive, "Archive");
export const MessageCircle = createIcon(faComments, "MessageCircle");
export const Headphones = createIcon(faHeadset, "Headphones");
export const Paperclip = createIcon(faPaperclip, "Paperclip");
export const Send = createIcon(faPaperPlane, "Send");
export const Smile = createIcon(faFaceSmile, "Smile");
export const Pin = createIcon(faThumbtack, "Pin");
export const RotateCcw = createIcon(faRotateLeft, "RotateCcw");
export const Paypal = createIcon(faPaypal, "Paypal");
