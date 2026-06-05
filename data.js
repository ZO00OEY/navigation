const SITE_DATA = {
  "title": "My Nav",
  "subtitle": "攻略 · 工具 · 资源集",
  "blocks": [
    {
      "type": "profile",
      "name": "芝士酱",
      "cols": 1,
      "rows": 1,
      "avatar": "avatar.jpg",
      "username": "ZO.oEY",
      "bio": "如果能帮到你很开心 (๑˃̵ᴗ˂̵)و",
      "socials": [
        { "name": "B站", "url": "https://space.bilibili.com/18637872" },
        { "name": "小红书", "url": "https://xhslink.com/m/4mCKNKRlZXc" },
        { "name": "GitHub", "url": "https://github.com/ZO00OEY" }
      ]
    },
    {
      "type": "nav-links",
      "name": "教程与资源",
      "icon": "📚",
      "cols": 4,
      "rows": 2,
      "subcategories": [
        {
          "name": "酒馆区",
          "page": "jiuguan",
          "links": [
            { "title": "SillyTavern 酒馆入门指南", "url": "#", "desc": "从零搭建你的 AI 角色扮演前端" },
            { "title": "角色卡制作完全教程", "url": "#", "desc": "写好一张角色卡的所有技巧" },
            { "title": "正则表达式速查手册", "url": "#", "desc": "酒馆常用正则脚本大全" },
            { "title": "世界书编写进阶", "url": "#", "desc": "Lorebook 结构与触发条件详解" },
            { "title": "API 对接与模型选择", "url": "#", "desc": "各模型 API 在酒馆中的配置方法" }
          ]
        },
        {
          "name": "ComfyUI 区",
          "page": "comfyui",
          "links": [
            { "title": "ComfyUI 安装与环境配置", "url": "#", "desc": "Windows / Linux 一站式安装教程" },
            { "title": "工作流合集推荐", "url": "#", "desc": "精选文生图、图生图工作流打包" },
            { "title": "节点详解系列", "url": "#", "desc": "常用节点参数与使用场景说明" },
            { "title": "模型推荐与对比", "url": "#", "desc": "Checkpoint / LoRA / VAE 模型评测" }
          ]
        },
        {
          "name": "Obsidian 区",
          "page": "obsidian",
          "links": [
            { "title": "Obsidian 入门配置指南", "url": "#", "desc": "从安装到写出第一篇笔记" },
            { "title": "必装插件清单", "url": "#", "desc": "提升效率的社区插件推荐与配置" },
            { "title": "主题美化推荐", "url": "#", "desc": "高颜值 CSS 主题与自定义片段" },
            { "title": "知识管理方法论", "url": "#", "desc": "PARA / Zettelkasten 在 Obsidian 中的实践" }
          ]
        }
      ]
    },
    {
      "type": "nav-links",
      "name": "妙妙小工具",
      "icon": "🛠️",
      "cols": 2,
      "rows": 1,
      "links": [
        { "title": "JSON 格式化", "url": "#", "desc": "在线美化与校验 JSON 数据" },
        { "title": "Base64 编解码", "url": "#", "desc": "文本与 Base64 互转" },
        { "title": "正则表达式测试", "url": "#", "desc": "可视化正则匹配与调试" },
        { "title": "时间戳转换", "url": "#", "desc": "Unix 时间戳与日期互转" }
      ]
    },
    {
      "type": "nav-links",
      "name": "好用站点",
      "icon": "🌐",
      "cols": 2,
      "rows": 1,
      "links": [
        { "title": "【影视】硬核指南", "url": "https://yinghezhinan.com/", "desc": "影视资源与深度解析" },
        { "title": "【影视】剧OK", "url": "https://juok3.top/", "desc": "在线追剧平台" },
        { "title": "在线工具箱", "url": "http://tool.myop.cn/", "desc": "实用在线工具集合" }
      ]
    }
  ]
};
