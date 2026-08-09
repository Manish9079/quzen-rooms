import { SlidersHorizontal, Mic, Bell, ShieldCheck } from 'lucide-react';
import Toggle from '../components/common/Toggle';
import { useUser } from '../context/UserContext';
import { useToast } from '../components/common/Toast';
import './Settings.css';

export default function Settings() {
  const { settings, updateSettings } = useUser();
  const showToast = useToast();

  function toggle(key, label) {
    updateSettings({ [key]: !settings[key] });
    showToast(`${label} ${!settings[key] ? 'enabled' : 'disabled'}`, 'info');
  }

  return (
    <div className="qz-settings">
      <div className="qz-container qz-settings__inner">
        <div className="qz-settings__intro">
          <span className="qz-eyebrow"><SlidersHorizontal size={13} /> Settings</span>
          <h1>Tune how rooms behave for you</h1>
          <p>These preferences are saved on this device and apply the next time you join or create a room.</p>
        </div>

        <div className="qz-settings__group qz-neu">
          <h2><Mic size={16} strokeWidth={2.2} /> Audio &amp; video</h2>
          <Toggle checked={settings.micOnJoin} onChange={() => toggle('micOnJoin', 'Join with mic on')} label="Join with microphone on" description="Otherwise you'll join muted and switch on manually" />
          <Toggle checked={settings.cameraOnJoin} onChange={() => toggle('cameraOnJoin', 'Join with camera on')} label="Join with camera on" description="Otherwise your camera stays off until you enable it" />
          <Toggle checked={settings.noiseSuppression} onChange={() => toggle('noiseSuppression', 'Noise suppression')} label="Noise suppression" description="Reduce background noise while you talk" />
        </div>

        <div className="qz-settings__group qz-neu">
          <h2><Bell size={16} strokeWidth={2.2} /> Notifications</h2>
          <Toggle checked={settings.chatSounds} onChange={() => toggle('chatSounds', 'Chat sounds')} label="Chat sound alerts" description="Play a soft sound on new messages" />
        </div>

        <div className="qz-settings__group qz-neu qz-settings__group--muted">
          <h2><ShieldCheck size={16} strokeWidth={2.2} /> Privacy</h2>
          <p className="qz-settings__note">
            Qyzen Rooms never turns on your camera or microphone without you tapping the control first â€”
            every room asks your browser for permission fresh.
          </p>
        </div>
      </div>
    </div>
  );
}

