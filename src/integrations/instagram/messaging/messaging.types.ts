/**
 * Instagram Messaging Types
 * Based on Instagram Platform API for messaging
 */

export interface MessageRecipient {
  id: string;
}

export interface QuickReply {
  content_type: 'text';
  title: string;
  payload: string;
  image_url?: string;
}

export interface GenericTemplateElement {
  title: string;
  subtitle?: string;
  image_url?: string;
  default_action?: {
    type: 'web_url';
    url: string;
  };
  buttons?: MessageButton[];
}

export interface MessageButton {
  type: 'web_url' | 'postback';
  title: string;
  url?: string;
  payload?: string;
}

export interface GenericTemplate {
  template_type: 'generic';
  elements: GenericTemplateElement[];
}

export interface ButtonTemplate {
  template_type: 'button';
  text: string;
  buttons: MessageButton[];
}

export interface MessageAttachment {
  type: 'template' | 'image' | 'video' | 'audio' | 'file';
  payload?: GenericTemplate | ButtonTemplate;
  url?: string;
}

export interface SendMessageRequest {
  recipient: MessageRecipient;
  message?: {
    text?: string;
    attachment?: MessageAttachment;
    quick_replies?: QuickReply[];
  };
  sender_action?: 'typing_on' | 'typing_off' | 'mark_seen';
  access_token: string;
}

export interface SendMessageResponse {
  success: boolean;
  data?: {
    recipient_id: string;
    message_id: string;
  };
  error?: string;
}

export interface IncomingMessage {
  id: string;
  created_time: string;
  from: {
    id: string;
    username: string;
  };
  to: {
    id: string;
  };
  message: string;
  attachments?: {
    type: string;
    url: string;
  }[];
}

export interface GetMessagesRequest {
  access_token: string;
  limit?: number;
  after?: string;
  before?: string;
}

export interface GetMessagesResponse {
  success: boolean;
  data?: {
    data: IncomingMessage[];
    paging?: {
      cursors: {
        before: string;
        after: string;
      };
    };
  };
  error?: string;
}

export interface PersistentMenuButton {
  type: 'web_url' | 'postback';
  title: string;
  url?: string;
  payload?: string;
}

export interface PersistentMenu {
  persistent_menu: {
    locale: string;
    composer_input_disabled: boolean;
    call_to_actions: PersistentMenuButton[];
  }[];
}

export interface SetPersistentMenuRequest {
  access_token: string;
  menu: PersistentMenu;
}

export interface SetPersistentMenuResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface GetStartedButton {
  get_started: {
    payload: string;
  };
}

export interface SetGetStartedRequest {
  access_token: string;
  get_started: GetStartedButton;
}

export interface SetGetStartedResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  template_type: 'generic' | 'button' | 'quick_reply';
  content: GenericTemplate | ButtonTemplate | QuickReply[];
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateRequest {
  name: string;
  template_type: 'generic' | 'button' | 'quick_reply';
  content: GenericTemplate | ButtonTemplate | QuickReply[];
}

export interface CreateTemplateResponse {
  success: boolean;
  data?: MessageTemplate;
  error?: string;
}