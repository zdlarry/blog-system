use blog_management;
drop table papers;
create table papers(
	p_name varchar(200) not null, -- 标题.
    p_url varchar(100) references contain(p_url), -- 对应url,自动生成
    p_date datetime primary key, -- 日期。自动生成
    p_type varchar(20) not null, -- 类型.
    p_likenum varchar(20) not null, -- 点赞数目，记录
    p_jpg_url varchar(1000) not null-- 图片url.
)default charset=utf8;

drop table manager;
create table manager(
	uname varchar(50) primary key, -- 用户名称
    upass varchar(50) not null-- 密码
)default charset=utf8;

drop table contain;
create table contain(
	p_url varchar(100) primary key, -- 路径 
    p_contain longblob not null-- 内容 
)default charset=utf8;

drop table visit;
create table visit(
	p_url varchar(100) primary key, -- 路径 
    p_visit varchar(20) not null-- 访问数量
)default charset=utf8;

drop table users;
create table users(
	uname varchar(50) primary key, -- 用户名
    upass varchar(50) not null, -- 密码 
    uhead_img varchar(300) not null -- 头像链接 
)default charset=utf8;

drop table userinfo;
create table userinfo(
	uname varchar(50) primary key, -- 用户名
    usex varchar(10),
    uxinzuo varchar(20),
    ubirth varchar(20),
    utel varchar(20),
    ulocation varchar(200),
    uschool varchar(200),
    unickname varchar(30)
)default charset=utf8;

drop table chatlog;
create table chatlog(
	ufrom varchar(50) not null, -- 用户from
    uto varchar(50) not null,
    msg blob not null,
    mtime datetime not null
)default charset=utf8;

drop table comments;
create table comments(
	ctime datetime primary key,
    cname varchar(50) not null,
    clocation varchar(100) not null,
    cheadurl varchar(300) not null,
    comments varchar(500) not null,
    clikenum varchar(10) not null
)default charset=utf8;

drop procedure register_user;
delimiter //
create procedure register_user(u_name varchar(50), u_pass varchar(50), u_url varchar(300))
begin
	if exists (select uname from users where uname = u_name) then
		select 0 as 'result';
    else
		insert into users values(u_name, u_pass, u_url);
        insert into userinfo(uname) values(u_name);
        select 1 as 'result';
    end if;
end
//delimiter ;

drop procedure check_man;
delimiter // 
create procedure check_man(u_name varchar(50), u_pass varchar(50))
begin
	declare apass varchar(50);
    select upass into apass from manager where uname = u_name;
    if u_pass = apass then
		select 1 as 'result';
    else
		select 0 as 'result';
    end if;
end
//delimiter ; 

drop procedure check_users;
delimiter // 
create procedure check_users(u_name varchar(50), u_pass varchar(50))
begin
	declare apass varchar(50);
    select upass into apass from users where uname = u_name;
    if u_pass = apass then
		select 1 as 'result';
    else
		select 0 as 'result';
    end if;
end
//delimiter ; 

drop procedure add_visit;
delimiter // 
create procedure add_visit(purl varchar(500))
begin
	if exists (select * from visit where p_url = purl) then
		update visit set p_visit = p_visit + 1 where p_url = purl;
    else
		insert into visit values(purl, 1);
    end if;
    select p_visit from visit where p_url = purl;
end
//delimiter ; 

drop trigger delete_paper;
delimiter //
create trigger delete_paper after delete on papers for each row
begin
	delete from contain where p_url = old.p_url;
end
//delimiter ;