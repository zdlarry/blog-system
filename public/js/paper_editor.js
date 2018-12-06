var testEditor;

$(function() {

    testEditor = editormd("my-editormd", {
        width : '100%',
        height : 550,
        syncScrolling : "single",
        path : "../mdeditor/lib/", //
        imageUpload    : true,
        imageFormats   : ["jpg", "jpeg", "gif", "png", "bmp", "webp"],
        imageUploadURL : "/imageUpload", //图片上传服务器地址
        saveHTMLToTextarea : true,
        emoji: true, //表情
        flowChart: true, //开启流程图支持
        sequenceDiagram: true, //时序图支持
        codeFold: true,
        onload: function() {

        }
    })

})

$('#img-file').fileinput({
    language: 'zh', //设置语言
    uploadUrl: '/imageUpload',
    enctype: 'multipart/form-data',
    browseClass: "btn btn-info", //按钮样式 
    showCaption: true,
    allowedFileExtensions: ['jpg', 'gif', 'png', 'bmp', 'jpeg', 'webp'],//接收的文件后缀
    showUpload: false, //是否显示上传按钮
    dropZoneEnabled: false, //是否显示拖拽区域
    showPreview: false
})