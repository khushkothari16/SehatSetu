import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Video,
  X,
  AlertTriangle,
  Sparkles,
  Shield,
  Trash2,
  PhoneCall,
  User,
  ArrowRight,
  Volume2,
  VolumeX
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { voiceService } from '../services/voiceService';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';

export const AIAssistant = ({ onNavigate }) => {
  const { t, language, tr } = useLanguage();
  const { addToast } = useNotifications();

  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      role: 'assistant',
      text: tr(
        'Namaste Rahul! I am your SehatSetu AI Health Guide. You can ask me basic health questions using text, voice, or attach photos/videos in your language.\n\n*Please remember: I provide general health literacy and non-diagnostic triage support. I do not replace licensed medical consultations or emergency services.*',
        'नमस्ते राहुल! मैं आपका सेहतसेतु एआई स्वास्थ्य सहायक हूँ। आप मुझसे बोलकर, लिखकर या फोटो/वीडियो भेजकर स्वास्थ्य संबंधी प्रश्न पूछ सकते हैं।\n\n*कृपया ध्यान दें: मैं केवल प्राथमिक स्वास्थ्य सलाह प्रदान करता हूँ, यह डॉक्टर के परामर्श का विकल्प नहीं है।*',
        'नमस्ते राहुल! मी तुमचा सेहतसेतू एआय आरोग्य सहाय्यक आहे. तुम्ही बोलून, लिहून किंवा फोटो/व्हिडिओ पाठवून तुमचे आरोग्यविषयक प्रश्न विचारू शकता.\n\n*कृपया लक्षात ठेवा: मी केवळ प्राथमिक माहिती व मार्गदर्शन देतो, हे डॉक्टरांच्या प्रत्यक्ष सल्ल्याचा पर्याय नाही.*'
      ),
      time: 'Just now',
      isEmergencyAlert: false
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Attachment state
  const [mediaAttachment, setMediaAttachment] = useState(null); // { url, type, name }
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    tr('How can I manage a mild fever at home?', 'घर पर हल्के बुखार का इलाज कैसे करें?', 'घरी हलक्या तापावर काय उपाय करावेत?'),
    tr('I have a cough. What precautions should I take?', 'मुझे खांसी है, क्या सावधानियां बरतनी चाहिए?', 'मला खोकला आहे, कोणती काळजी घ्यावी?'),
    tr('How to prepare ORS solution properly?', 'ओआरएस (ORS) का घोल सही तरीके से कैसे बनाएं?', 'ओआरएस (ORS) चे पाणी योग्य प्रकारे कसे बनवावे?'),
    tr('When should I see a doctor immediately?', 'डॉक्टर को तुरंत कब दिखाना चाहिए?', 'डॉक्टरांकडे तातडीने केव्हा जावे?')
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      voiceService.stopSpeaking();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  // Real Speech Recognition with voiceService
  const handleToggleVoice = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsRecording(false);
      return;
    }

    if (!voiceService.isSpeechRecognitionSupported()) {
      addToast(
        tr(
          'Speech recognition is not supported in this browser. Please use Chrome or Edge.',
          'माइक सपोर्ट उपलब्ध नहीं है। कृपया गूगल क्रोम का उपयोग करें।',
          'माइक सपोर्ट उपलब्ध नाही. कृपया गुगल क्रोम किंवा एज वापरा.'
        ),
        'warning'
      );
      return;
    }

    // Stop speaking if playing
    voiceService.stopSpeaking();
    setSpeakingMsgId(null);

    setIsRecording(true);
    addToast(
      tr(
        '🎙️ Microphone active... Speak now',
        '🎙️ माइक चालू है... बोलिए, हम सुन रहे हैं',
        '🎙️ माइक सुरू आहे... बोला, आम्ही ऐकत आहोत'
      ),
      'info'
    );

    recognitionRef.current = voiceService.startListening({
      language,
      onResult: ({ text }) => {
        setInputText(text);
      },
      onError: (err) => {
        console.warn('Recognition error:', err);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      }
    });
  };

  // Text-To-Speech Play / Stop
  const handleToggleSpeak = (msgId, text) => {
    if (speakingMsgId === msgId) {
      voiceService.stopSpeaking();
      setSpeakingMsgId(null);
      return;
    }

    voiceService.stopSpeaking();
    setSpeakingMsgId(msgId);

    voiceService.speakText({
      text,
      language,
      onStart: () => setSpeakingMsgId(msgId),
      onEnd: () => setSpeakingMsgId(null),
      onError: () => setSpeakingMsgId(null)
    });
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVid = file.type.startsWith('video');
    const isImg = file.type.startsWith('image');

    if (!isVid && !isImg) {
      addToast('Please upload an image or short video only.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaAttachment({
        url: reader.result,
        type: isVid ? 'video' : 'image',
        name: file.name
      });
      addToast(`${isVid ? 'Video' : 'Photo'} attached. Note: AI image triage is non-diagnostic.`, 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (customPrompt) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() && !mediaAttachment) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: textToSend,
      media: mediaAttachment,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setMediaAttachment(null);
    setIsTyping(true);

    try {
      const response = await aiService.queryAssistant({
        prompt: textToSend,
        mediaType: userMsg.media?.type,
        mediaUrl: userMsg.media?.url,
        language
      });

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: response.text,
          isEmergencyAlert: response.isEmergencyAlert,
          suggestedActions: response.suggestedActions,
          followUpSuggestions: response.followUpSuggestions,
          disclaimer: response.disclaimer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      addToast('Error communicating with AI service', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear conversation history?')) {
      setMessages([
        {
          id: Date.now(),
          role: 'assistant',
          text: 'Chat history cleared. How can I assist your health literacy today?',
          time: 'Just now'
        }
      ]);
    }
  };

  const formatBold = (str) => {
    if (!str) return '';
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} style={{ margin: '0.75rem 0 0.25rem 0', fontSize: '1rem', fontWeight: 800, color: 'inherit' }}>
            {formatBold(trimmed.replace('### ', ''))}
          </h4>
        );
      }

      if (trimmed.startsWith('## ')) {
        return (
          <h3 key={idx} style={{ margin: '0.85rem 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'inherit' }}>
            {formatBold(trimmed.replace('## ', ''))}
          </h3>
        );
      }

      if (trimmed === '---') {
        return <hr key={idx} style={{ margin: '0.6rem 0', border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)' }} />;
      }

      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', marginLeft: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{ color: 'inherit', fontWeight: 800 }}>•</span>
            <span style={{ flex: 1 }}>{formatBold(trimmed.slice(2))}</span>
          </div>
        );
      }

      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', marginLeft: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{ fontWeight: 800, minWidth: '18px' }}>{numMatch[1]}.</span>
            <span style={{ flex: 1 }}>{formatBold(numMatch[2])}</span>
          </div>
        );
      }

      if (!trimmed) {
        return <div key={idx} style={{ height: '0.45rem' }} />;
      }

      return (
        <p key={idx} style={{ margin: '0 0 0.35rem 0', lineHeight: 1.55 }}>
          {formatBold(line)}
        </p>
      );
    });
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: 880, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">
            <Bot size={28} color="#7C3AED" />
            {t('aiAssistant')}
          </h1>
        </div>

        <button onClick={handleClearChat} className="btn btn-outline btn-sm">
          <Trash2 size={15} />
          Clear Chat
        </button>
      </div>

      {/* Prominent AI Medical Safety Disclaimer (Section 27) */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          color: '#1E40AF',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.25rem'
        }}
      >
        <Shield size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Patient Safety Notice:</strong> This AI assistant provides general guidance only and does NOT diagnose conditions, prescribe medications, or replace in-person doctor evaluation.
        </span>
      </div>

      {/* Chat Container */}
      <div
        className="card"
        style={{
          height: '560px',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          border: '1px solid var(--border)'
        }}
      >
        {/* Messages Stream */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isEmerg = msg.isEmergencyAlert;

            return (
              <div
                key={msg.id}
                className="animate-fade-in"
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    backgroundColor: isUser
                      ? 'var(--primary)'
                      : isEmerg
                        ? 'var(--emergency-light)'
                        : 'var(--surface-alt)',
                    color: isUser
                      ? 'white'
                      : isEmerg
                        ? '#7F1D1D'
                        : 'var(--text-primary)',
                    border: isEmerg ? '2px solid #FCA5A5' : '1px solid var(--border-subtle)',
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    borderBottomRightRadius: isUser ? '4px' : 'var(--radius-lg)',
                    borderBottomLeftRadius: !isUser ? '4px' : 'var(--radius-lg)',
                    fontSize: '0.925rem',
                    lineHeight: 1.5,
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {/* Media attachment if any */}
                  {msg.media && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      {msg.media.type === 'image' ? (
                        <img
                          src={msg.media.url}
                          alt="User photo"
                          style={{ maxHeight: 180, borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                        />
                      ) : (
                        <video
                          src={msg.media.url}
                          controls
                          style={{ maxHeight: 180, borderRadius: 'var(--radius-md)' }}
                        />
                      )}
                    </div>
                  )}

                  {/* Message body */}
                  <div>{renderFormattedText(msg.text)}</div>

                  {/* Suggested emergency actions if red flag */}
                  {msg.suggestedActions && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      {msg.suggestedActions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => act.action === 'OPEN_EMERGENCY' ? onNavigate('emergency') : onNavigate('find-doctor')}
                          className={`btn btn-sm ${act.type === 'emergency' ? 'btn-emergency' : 'btn-primary'}`}
                          style={{ fontWeight: 700 }}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Non-diagnostic disclaimer footer on assistant answers */}
                  {msg.disclaimer && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid rgba(0,0,0,0.06)',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic'
                      }}
                    >
                      {msg.disclaimer}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', padding: '0 4px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {msg.time}
                  </span>

                  {/* Speaker Button on Assistant Messages */}
                  {msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => handleToggleSpeak(msg.id, msg.text)}
                      className="btn btn-ghost btn-sm"
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        borderRadius: '12px',
                        color: speakingMsgId === msg.id ? '#DC2626' : '#7C3AED',
                        backgroundColor: speakingMsgId === msg.id ? '#FEE2E2' : '#F3E8FF',
                        border: speakingMsgId === msg.id ? '1px solid #FCA5A5' : '1px solid #DDD6FE',
                        cursor: 'pointer'
                      }}
                      title={speakingMsgId === msg.id ? 'Stop listening' : 'Listen to this response aloud'}
                    >
                      {speakingMsgId === msg.id ? (
                        <>
                          <VolumeX size={13} />
                          <span>{tr('Stop', 'रोकें', 'थांबवा')}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={13} />
                          <span>{tr('🔊 Listen', '🔊 बोलकर सुनें', '🔊 ऐका')}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Follow up suggestions */}
                {msg.followUpSuggestions && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {msg.followUpSuggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSendMessage(suggestion)}
                        className="btn btn-ghost btn-sm"
                        style={{
                          fontSize: '0.75rem',
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          padding: '0.25rem 0.65rem'
                        }}
                      >
                        {suggestion} <ArrowRight size={12} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="animate-fade-in" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Sparkles size={16} color="#7C3AED" />
              <span>{tr('Analyzing with medical safety filters...', 'स्वास्थ्य मानकों के अनुसार विश्लेषण जारी है...', 'वैद्यकीय सुरक्षा नियमांनुसार विश्लेषण करत आहे...')}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Bar */}
        <div
          style={{
            padding: '0.5rem 1rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-alt)',
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}
        >
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'white',
                border: '1px solid var(--border)',
                whiteSpace: 'nowrap',
                padding: '0.3rem 0.75rem'
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Attachment Preview Box */}
        {mediaAttachment && (
          <div
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: 'var(--primary-hover)'
            }}
          >
            <span>Attached {mediaAttachment.type}: <strong>{mediaAttachment.name}</strong></span>
            <button
              onClick={() => setMediaAttachment(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--emergency)' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--border)',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {/* Media Attachment Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*,video/*"
            onChange={handleMediaUpload}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => fileInputRef.current?.click()}
            style={{ borderRadius: 'var(--radius-full)', width: 40, height: 40, padding: 0 }}
            title="Attach photo or short video"
          >
            <ImageIcon size={20} color="var(--text-secondary)" />
          </button>

          {/* Voice Record Button */}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleToggleVoice}
            style={{
              borderRadius: 'var(--radius-full)',
              width: 40,
              height: 40,
              padding: 0,
              backgroundColor: isRecording ? '#FEE2E2' : 'transparent',
              color: isRecording ? 'var(--emergency)' : 'var(--text-secondary)'
            }}
            title={isRecording ? 'Stop Recording' : 'Speak in your language'}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, height: 44, margin: 0 }}
            placeholder={isRecording ? `Listening... (${recordingSeconds}s)` : "Ask in English, हिन्दी, or मराठी..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />

          {/* Send Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() && !mediaAttachment}
            style={{ borderRadius: 'var(--radius-md)', padding: '0.6rem 1.25rem' }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
